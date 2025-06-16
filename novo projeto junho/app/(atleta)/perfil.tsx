import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSportConfig, getSportStatistics, getSportPositions } from '../../utils/sportsConfig';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';

// Adicionar interface para tipagem
interface PlayerInfo {
  time: string;
  posicao: string;
  esporte: string;
}

interface PlayerStats {
  [key: string]: number;
}

export default function PerfilAtleta() {
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [shareStats, setShareStats] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({});
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({
    time: 'Sem time',
    posicao: 'Não definida',
    esporte: user?.sport || 'Não definido'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedBirthDate, setEditedBirthDate] = useState('');
  const [editedHeight, setEditedHeight] = useState('');
  const [editedWeight, setEditedWeight] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openPosicao, setOpenPosicao] = useState(false);
  const [posicaoSelecionada, setPosicaoSelecionada] = useState<string | null>(null);
  const [posicoesDisponiveis, setPosicoesDisponiveis] = useState<Array<{label: string, value: string}>>([]);

  useEffect(() => {
    loadPlayerData();
    loadSettings();
    requestImagePermission();
    if (user?.sport) {
      const posicoes = getSportPositions(user.sport).map(pos => ({
        label: pos.charAt(0).toUpperCase() + pos.slice(1),
        value: pos
      }));
      setPosicoesDisponiveis(posicoes);
    }
  }, []);

  async function requestImagePermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
    }
  }

  async function pickImage() {
    try {
      Alert.alert(
        'Alterar Foto de Perfil',
        'Como você deseja alterar sua foto?',
        [
          {
            text: 'Tirar Foto',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permissão Necessária',
                  'Precisamos de permissão para acessar sua câmera.',
                  [{ text: 'OK' }]
                );
                return;
              }
              await handleImageSelection(ImagePicker.launchCameraAsync);
            }
          },
          {
            text: 'Escolher da Galeria',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Permissão Necessária',
                  'Precisamos de permissão para acessar sua galeria de fotos.',
                  [{ text: 'OK' }]
                );
                return;
              }
              await handleImageSelection(ImagePicker.launchImageLibraryAsync);
            }
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.log('Erro ao iniciar seleção de imagem:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a seleção de imagem. Tente novamente.');
    }
  }

  async function handleImageSelection(imagePickerFunction: any) {
    try {
      setIsLoading(true);
      const result = await imagePickerFunction({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        // Salvar a imagem no AsyncStorage
        await AsyncStorage.setItem(`@GestaoTimes:profile_image_${user?.id}`, result.assets[0].uri);
        setProfileImage(result.assets[0].uri);
        
        // Atualizar o perfil do usuário com a nova imagem
        const updatedUser = {
          ...user,
          avatar: result.assets[0].uri
        };
        await updateProfile(updatedUser);
        
        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      }
    } catch (error) {
      console.log('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPlayerData() {
    try {
      setIsLoading(true);
      // Carregar dados do jogador
      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      const atletaPlayer = players.find((p: any) => 
        p.name === user?.name || p.email === user?.email
      );
      
      if (atletaPlayer) {
        // Carregar imagem do perfil
        const savedImage = await AsyncStorage.getItem(`@GestaoTimes:profile_image_${user?.id}`);
        if (savedImage) {
          setProfileImage(savedImage);
        }

        // Carregar dados do time apenas se o atleta estiver em um time
        let timeInfo = 'Aguardando definição do professor';
        if (atletaPlayer.teamId) {
          const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
          const teams = storedTeams ? JSON.parse(storedTeams) : [];
          const team = teams.find((t: any) => t.id === atletaPlayer.teamId);
          if (team) {
            timeInfo = team.name;
          }
        }
        
        // Carregar estatísticas reais baseadas no esporte
        const storedStats = await AsyncStorage.getItem(`@GestaoTimes:player_stats_${atletaPlayer.id}`);
        const stats = storedStats ? JSON.parse(storedStats) : {};
        
        const sportConfig = getSportConfig(user?.sport || 'futebol');
        const sportStats: PlayerStats = {};
        
        if (sportConfig) {
          sportConfig.statistics.forEach(stat => {
            sportStats[stat.key] = stats[stat.key] || 0;
          });
        }

        // Verificar se a posição é válida para o esporte
        const posicoesValidas = getSportPositions(user?.sport || 'futebol');
        const posicao = atletaPlayer.position && posicoesValidas.includes(atletaPlayer.position)
          ? atletaPlayer.position
          : 'Aguardando definição do professor';
        
        setPlayerStats(sportStats);
        setPlayerInfo({
          time: timeInfo,
          posicao: posicao,
          esporte: user?.sport || atletaPlayer.sport || 'Não definido'
        });

        // Inicializar estados de edição com dados atuais
        setEditedName(atletaPlayer.name || user?.name || '');
        setEditedEmail(atletaPlayer.email || user?.email || '');
        setEditedPhone(atletaPlayer.phone || '');
        setEditedBirthDate(atletaPlayer.birthDate || '');
        setEditedHeight(atletaPlayer.height?.toString() || '');
        setEditedWeight(atletaPlayer.weight?.toString() || '');
      }
    } catch (error) {
      console.log('Erro ao carregar dados do jogador:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const settings = await AsyncStorage.getItem(`@GestaoTimes:athlete_settings_${user?.id}`);
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotificationsEnabled(parsedSettings.notifications ?? true);
        setShareStats(parsedSettings.shareStats ?? false);
        setPublicProfile(parsedSettings.publicProfile ?? false);
      }
    } catch (error) {
      console.log('Erro ao carregar configurações:', error);
    }
  }

  async function saveSettings() {
    try {
      const settings = {
        notifications: notificationsEnabled,
        shareStats,
        publicProfile
      };
      await AsyncStorage.setItem(`@GestaoTimes:athlete_settings_${user?.id}`, JSON.stringify(settings));
    } catch (error) {
      console.log('Erro ao salvar configurações:', error);
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente.',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel' 
        },
        { 
          text: 'Sair', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível sair da conta. Tente novamente.');
            }
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Editar Perfil',
      'Esta funcionalidade estará disponível em breve. Entre em contato com seu professor para alterações.',
      [{ text: 'OK' }]
    );
  };

  const handleContactProfessor = () => {
    Alert.alert(
      'Contatar Professor',
      'Deseja enviar uma mensagem para seu professor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar', 
          onPress: () => {
            Alert.alert('Sucesso!', 'Mensagem enviada para o professor!');
          }
        },
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Ajuda',
      'Como atleta, você pode:\n\n• Ver suas estatísticas pessoais\n• Receber orientações do professor\n• Acompanhar sua agenda de treinos\n• Visualizar seu progresso\n\nPara dúvidas, entre em contato com seu professor.',
      [{ text: 'OK' }]
    );
  };

  const settingsOptions = [
    {
      title: 'Editar Perfil',
      subtitle: 'Atualize suas informações pessoais',
      icon: 'person-outline',
      onPress: () => setIsEditing(true),
    },
    {
      title: 'Alterar Senha',
      subtitle: 'Atualize sua senha de acesso',
      icon: 'lock-closed-outline',
      onPress: () => setIsChangingPassword(true),
    },
    {
      title: 'Notificações',
      subtitle: 'Gerencie suas notificações',
      icon: 'notifications-outline',
      onPress: () => {
        // Implementar lógica de notificações
      },
    },
    {
      title: 'Privacidade',
      subtitle: 'Gerencie suas configurações de privacidade',
      icon: 'shield-outline',
      onPress: () => {
        // Implementar lógica de privacidade
      },
    },
  ];

  // Função para formatar o nome do time
  function formatTeamName(teamName: string): string {
    if (!teamName || teamName === 'Sem time') {
      return 'Aguardando definição do professor';
    }
    return teamName.charAt(0).toUpperCase() + teamName.slice(1).toLowerCase();
  }

  // Função para formatar a posição
  function formatPosition(position: string): string {
    if (!position || position === 'Não definida') {
      return 'Aguardando definição do professor';
    }
    return position.charAt(0).toUpperCase() + position.slice(1).toLowerCase();
  }

  // Função para validar e formatar data
  function formatDate(date: string): string {
    if (!date) return '';
    // Formato esperado: DD/MM/AAAA
    const parts = date.split('/');
    if (parts.length !== 3) return date;
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }

  // Função para validar e formatar telefone
  function formatPhone(phone: string): string {
    if (!phone) return '';
    // Remove caracteres não numéricos
    const numbers = phone.replace(/\D/g, '');
    // Formata como (XX) XXXXX-XXXX
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  // Função para validar e formatar altura
  function formatHeight(height: string): string {
    if (!height) return '';
    const numHeight = parseFloat(height);
    if (isNaN(numHeight)) return '';
    return `${numHeight} cm`;
  }

  // Função para validar e formatar peso
  function formatWeight(weight: string): string {
    if (!weight) return '';
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) return '';
    return `${numWeight} kg`;
  }

  // Função para validar email
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Função para validar data
  function validateDate(date: string): boolean {
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return dateRegex.test(date);
  }

  // Função para validar telefone
  function validatePhone(phone: string): boolean {
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    return phoneRegex.test(phone);
  }

  async function handleSaveProfile() {
    try {
      setIsLoading(true);

      // Validações
      if (!editedName.trim()) {
        Alert.alert('Erro', 'O nome é obrigatório');
        return;
      }

      if (!validateEmail(editedEmail)) {
        Alert.alert('Erro', 'Email inválido');
        return;
      }

      if (editedPhone && !validatePhone(editedPhone)) {
        Alert.alert('Erro', 'Telefone inválido');
        return;
      }

      if (editedBirthDate && !validateDate(editedBirthDate)) {
        Alert.alert('Erro', 'Data de nascimento inválida');
        return;
      }

      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      const playerIndex = players.findIndex((p: any) => 
        p.name === user?.name || p.email === user?.email
      );
      
      if (playerIndex !== -1) {
        // Atualizar dados do jogador
        players[playerIndex] = {
          ...players[playerIndex],
          name: editedName.trim(),
          email: editedEmail.trim(),
          phone: editedPhone ? formatPhone(editedPhone) : '',
          birthDate: editedBirthDate ? formatDate(editedBirthDate) : '',
          height: parseFloat(editedHeight) || 0,
          weight: parseFloat(editedWeight) || 0,
        };
        
        // Salvar alterações
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(players));
        
        // Atualizar dados do usuário
        const updatedUser = {
          ...user,
          name: editedName.trim(),
          email: editedEmail.trim(),
        };
        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(updatedUser));
        
        // Atualizar estado local
        updateProfile(updatedUser);
        setIsEditing(false);
        
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.log('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangePassword() {
    try {
      // Validar senhas
      if (newPassword !== confirmPassword) {
        setPasswordError('As senhas não coincidem');
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      
      // Verificar senha atual
      const storedUsers = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const userIndex = users.findIndex((u: any) => u.email === user?.email);
      
      if (userIndex === -1) {
        setPasswordError('Usuário não encontrado');
        return;
      }
      
      if (users[userIndex].password !== currentPassword) {
        setPasswordError('Senha atual incorreta');
        return;
      }
      
      // Atualizar senha
      users[userIndex].password = newPassword;
      await AsyncStorage.setItem('@GestaoTimes:users', JSON.stringify(users));
      
      // Limpar estados
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setIsChangingPassword(false);
      
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
    } catch (error) {
      console.log('Erro ao alterar senha:', error);
      Alert.alert('Erro', 'Não foi possível alterar a senha. Tente novamente.');
    }
  }

  const handleSalvarPosicao = async () => {
    try {
      if (!posicaoSelecionada) {
        Alert.alert('Erro', 'Por favor, selecione uma posição.');
        return;
      }

      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      const playerIndex = players.findIndex((p: any) => 
        p.name === user?.name || p.email === user?.email
      );
      
      if (playerIndex !== -1) {
        players[playerIndex] = {
          ...players[playerIndex],
          position: posicaoSelecionada
        };
        
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(players));
        
        setPlayerInfo(prev => ({
          ...prev,
          posicao: posicaoSelecionada
        }));
        
        Alert.alert('Sucesso', 'Posição atualizada com sucesso!');
      }
    } catch (error) {
      console.log('Erro ao salvar posição:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a posição.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header do Perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {isLoading ? (
                <View style={[styles.profileImage, styles.loadingContainer]}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                </View>
              ) : (
                <Image 
                  source={{ uri: profileImage || 'https://via.placeholder.com/120' }}
                  style={styles.profileImage}
                  onError={() => {
                    console.log('Erro ao carregar imagem');
                    setProfileImage(null);
                  }}
                />
              )}
              <TouchableOpacity 
                style={[styles.cameraButton, isLoading && styles.cameraButtonDisabled]}
                onPress={pickImage}
                disabled={isLoading}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={pickImage}
                disabled={isLoading}
              >
                <Text style={styles.changePhotoText}>
                  {isLoading ? 'Atualizando...' : 'Alterar Foto'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Informações do Atleta */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Meus Dados</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoLabel}>Posição:</Text>
              <TouchableOpacity 
                style={styles.posicaoButton}
                onPress={() => setOpenPosicao(true)}
              >
                <Text style={[styles.infoValue, playerInfo.posicao === 'Aguardando definição do professor' ? styles.pendingValue : null]}>
                  {formatPosition(playerInfo.posicao)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={[styles.infoValue, playerInfo.time === 'Aguardando definição do professor' ? styles.pendingValue : null]}>
                {formatTeamName(playerInfo.time)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="basketball" size={20} color="#666" />
              <Text style={styles.infoLabel}>Esporte:</Text>
              <Text style={styles.infoValue}>
                {playerInfo.esporte.charAt(0).toUpperCase() + playerInfo.esporte.slice(1).toLowerCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Estatísticas Rápidas */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Resumo do Desempenho - {playerInfo.esporte}</Text>
          {Object.keys(playerStats).length > 0 ? (
            <View style={styles.statsGrid}>
              {getSportStatistics(user?.sport || 'futebol').slice(0, 4).map((stat, index) => (
                <View key={stat.key} style={styles.statCard}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                  <Text style={styles.statNumber}>{playerStats[stat.key] || 0}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="stats-chart" size={32} color="#ccc" />
              <Text style={styles.noDataText}>Aguardando registro de estatísticas pelo professor</Text>
            </View>
          )}
        </View>

        {/* Informações do Atleta */}
        <View style={styles.athleteInfoSection}>
          <Text style={styles.sectionTitle}>Informações do Atleta</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoLabel}>Posição:</Text>
              <Text style={[styles.infoValue, !playerInfo.posicao || playerInfo.posicao === 'Não definida' ? styles.pendingValue : null]}>
                {playerInfo.posicao}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={[styles.infoValue, !playerInfo.time || playerInfo.time === 'Sem time' ? styles.pendingValue : null]}>
                {playerInfo.time}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="school" size={20} color="#666" />
              <Text style={styles.infoLabel}>Professor:</Text>
              <Text style={[styles.infoValue, styles.pendingValue]}>
                Aguardando atribuição
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoLabel}>Desde:</Text>
              <Text style={[styles.infoValue, styles.pendingValue]}>
                Aguardando início
              </Text>
            </View>
          </View>
        </View>

        {/* Conquistas */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <View style={styles.noDataContainer}>
            <Ionicons name="trophy" size={32} color="#ccc" />
            <Text style={styles.noDataText}>Aguardando conquistas</Text>
          </View>
        </View>

        {/* Configurações */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <View style={styles.settingsCard}>
            {settingsOptions.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.settingItem}
                onPress={option.onPress}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons name={option.icon as any} size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{option.title}</Text>
                    <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modal de Edição de Perfil */}
        <Modal
          visible={isEditing}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditing(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              
              <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                  {isLoading ? (
                    <View style={[styles.profileImage, styles.loadingContainer]}>
                      <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: profileImage || 'https://via.placeholder.com/120' }}
                      style={styles.profileImage}
                    />
                  )}
                  <TouchableOpacity 
                    style={[styles.cameraButton, isLoading && styles.cameraButtonDisabled]}
                    onPress={pickImage}
                    disabled={isLoading}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Seu nome"
                  maxLength={50}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={editedEmail}
                  editable={false}
                  placeholder="Seu email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.inputHelper}>O email não pode ser alterado</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={editedPhone}
                  onChangeText={(text) => {
                    const formatted = formatPhone(text);
                    setEditedPhone(formatted);
                  }}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Data de Nascimento</Text>
                <TextInput
                  style={styles.input}
                  value={editedBirthDate}
                  onChangeText={(text) => {
                    const formatted = formatDate(text);
                    setEditedBirthDate(formatted);
                  }}
                  placeholder="DD/MM/AAAA"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={editedHeight}
                  onChangeText={setEditedHeight}
                  placeholder="Sua altura"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={editedWeight}
                  onChangeText={setEditedWeight}
                  placeholder="Seu peso"
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Troca de Senha */}
        <Modal
          visible={isChangingPassword}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsChangingPassword(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Alterar Senha</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha Atual</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Digite a nova senha"
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme a nova senha"
                  secureTextEntry
                />
              </View>
              
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
              
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => {
                    setIsChangingPassword(false);
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleChangePassword}
                >
                  <Text style={styles.buttonText}>Alterar Senha</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Seleção de Posição */}
        <Modal
          visible={openPosicao}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setOpenPosicao(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Selecione sua Posição</Text>
                <TouchableOpacity onPress={() => setOpenPosicao(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <DropDownPicker
                items={posicoesDisponiveis}
                placeholder="Selecione sua posição"
                open={openPosicao}
                setOpen={setOpenPosicao}
                value={posicaoSelecionada}
                setValue={setPosicaoSelecionada}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={3000}
                zIndexInverse={1000}
                listMode="MODAL"
              />

              <TouchableOpacity
                style={styles.positionSaveButton}
                onPress={handleSalvarPosicao}
              >
                <Text style={styles.positionSaveButtonText}>Salvar Posição</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Botão de Logout */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        {/* Informações do App */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Versão Atleta 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Gestão de Times</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginRight: 16,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraButtonDisabled: {
    opacity: 0.5,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quickStatsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  athleteInfoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  achievementsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 10,
  },
  noDataText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  settingsContainer: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  settingRight: {
    marginLeft: 10,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
  pendingValue: {
    fontStyle: 'italic',
    color: '#666',
  },
  settingsCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  changePhotoButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  changePhotoText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  posicaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    borderColor: '#0066FF',
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  dropdownContainer: {
    borderColor: '#0066FF',
    backgroundColor: '#f9f9f9',
  },
  positionSaveButton: {
    backgroundColor: '#0066FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  positionSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
