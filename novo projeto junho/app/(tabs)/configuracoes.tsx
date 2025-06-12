import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../hooks/useColorScheme';
import { createBackupZip } from '../../utils/backup';

export default function Configuracoes() {
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const { isDark, toggleColorScheme } = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Estados para trocar senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Estados para editar perfil
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Estados para privacidade
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setPasswordLoading(true);
      
      // Simular verificação da senha atual (substitua pela sua lógica)
      if (currentPassword !== '123456') {
        Alert.alert('Erro', 'Senha atual incorreta.');
        return;
      }

      // Simular mudança de senha (substitua pela sua API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Sucesso!', 'Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a senha. Tente novamente.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erro', 'Por favor, digite um nome válido.');
      return;
    }

    try {
      setProfileLoading(true);
      
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
      });
      
      Alert.alert('Sucesso!', 'Perfil atualizado com sucesso!');
      setShowEditProfileModal(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleBackup = async () => {
    Alert.alert(
      'Backup dos Dados',
      'Deseja gerar e salvar um backup completo no dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Fazer Backup',
          onPress: async () => {
            try {
              if (user) {
                await createBackupZip({ user });
              }
              Alert.alert('Sucesso!', 'Backup realizado com sucesso!');
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível gerar o backup.');
            }
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      title: 'Editar Perfil',
      subtitle: 'Alterar nome e informações básicas',
      icon: 'person',
      onPress: () => {
        setEditName(user?.name || '');
        setEditEmail(user?.email || '');
        setShowEditProfileModal(true);
      },
    },
    {
      title: 'Perfil Completo',
      subtitle: 'Editar dados pessoais e esportivos',
      icon: 'create',
      onPress: () => router.push('/editarPerfil'),
    },
    {
      title: 'Trocar Senha',
      subtitle: 'Alterar senha de acesso',
      icon: 'key',
      onPress: () => setShowPasswordModal(true),
    },
    {
      title: 'Privacidade',
      subtitle: 'Configurações de privacidade e dados',
      icon: 'shield-checkmark',
      onPress: () => setShowPrivacyModal(true),
    },
    {
      title: 'Perfil Esportivo',
      subtitle: 'Configurar esporte e posição',
      icon: 'fitness',
      onPress: () => router.push('/perfilEsporte'),
    },
    {
      title: 'Relatórios',
      subtitle: 'Ver estatísticas e rankings',
      icon: 'stats-chart',
      onPress: () => router.push('/relatorios'),
    },
    {
      title: 'Notificações',
      subtitle: 'Receber alertas de jogos e treinos',
      icon: 'notifications',
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#767577', true: '#0066FF' }}
          thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
        />
      ),
    },
    {
      title: 'Modo Escuro',
      subtitle: 'Alternar tema do aplicativo',
      icon: isDark ? 'moon' : 'sunny',
      rightComponent: (
        <Switch
          value={isDark}
          onValueChange={toggleColorScheme}
          trackColor={{ false: '#767577', true: '#0066FF' }}
          thumbColor={isDark ? '#fff' : '#f4f3f4'}
        />
      ),
    },
    {
      title: 'Backup',
      subtitle: 'Fazer backup dos dados',
      icon: 'cloud-upload',
      onPress: handleBackup,
    },
    {
      title: 'Ajuda',
      subtitle: 'Central de ajuda e suporte',
      icon: 'help-circle',
      onPress: () => Alert.alert('Ajuda', 'Entre em contato conosco:\n\nEmail: suporte@gestaodetimes.com\nTelefone: (11) 99999-9999'),
    },
    {
      title: 'Sobre',
      subtitle: 'Informações do aplicativo',
      icon: 'information-circle',
      onPress: () => Alert.alert('Sobre', 'Gestão de Times v1.0.0\n\nDesenvolvido com React Native e Expo\n\nUm aplicativo completo para gerenciar times esportivos, jogadores, eventos e muito mais!'),
    },
  ];

  // Modal para trocar senha
  const PasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trocar Senha</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha Atual</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Digite sua senha atual"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Digite a nova senha"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Confirme a nova senha"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                importantForAutofill="no"
                keyboardType="default"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                <Text style={styles.saveButtonText}>
                  {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal para editar perfil
  const EditProfileModal = () => (
    <Modal
      visible={showEditProfileModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEditProfileModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Digite seu nome"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.modalInput, styles.disabledInput]}
                value={editEmail}
                editable={false}
              />
              <Text style={styles.helperText}>O email não pode ser alterado</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditProfile}
                disabled={profileLoading}
              >
                <Text style={styles.saveButtonText}>
                  {profileLoading ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal para privacidade
  const PrivacyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configurações de Privacidade</Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.privacyOption}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Compartilhamento de Dados</Text>
                <Text style={styles.privacySubtitle}>Permitir compartilhamento de estatísticas com outros usuários</Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                trackColor={{ false: '#767577', true: '#0066FF' }}
                thumbColor={dataSharing ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.privacyOption}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Análise de Uso</Text>
                <Text style={styles.privacySubtitle}>Ajudar a melhorar o app com dados de uso anônimos</Text>
              </View>
              <Switch
                value={analytics}
                onValueChange={setAnalytics}
                trackColor={{ false: '#767577', true: '#0066FF' }}
                thumbColor={analytics ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.privacyOption}>
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Comunicações de Marketing</Text>
                <Text style={styles.privacySubtitle}>Receber emails sobre novidades e promoções</Text>
              </View>
              <Switch
                value={marketing}
                onValueChange={setMarketing}
                trackColor={{ false: '#767577', true: '#0066FF' }}
                thumbColor={marketing ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.privacyButton}>
              <Text style={styles.privacyButtonText}>Ver Política de Privacidade</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.privacyButton}>
              <Text style={styles.privacyButtonText}>Solicitar Exclusão de Dados</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { width: '100%' }]}
                onPress={() => {
                  Alert.alert('Sucesso!', 'Configurações de privacidade salvas!');
                  setShowPrivacyModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Salvar Configurações</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configurações</Text>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#0066FF" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingItem}
              onPress={option.onPress}
              disabled={!option.onPress}
            >
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name={option.icon as any} size={20} color="#0066FF" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                {option.rightComponent || (
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 Gestão de Times</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <PasswordModal />
      <EditProfileModal />
      <PrivacyModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
    backgroundColor: '#FF3B30',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    outlineWidth: 0,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#0066FF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Privacy Modal Styles
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  privacyInfo: {
    flex: 1,
    marginRight: 15,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  privacyButton: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  privacyButtonText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '500',
  },
}); 