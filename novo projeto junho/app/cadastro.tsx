import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { AntiAutofillInput } from '../components/AntiAutofillInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPORTS_CONFIG } from '../utils/sportsConfig';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface Professor {
  id: string;
  name: string;
  email: string;
}

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'professor' | 'atleta' | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<string>('');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [openPosicao, setOpenPosicao] = useState(false);
  const [selectedPosicao, setSelectedPosicao] = useState<string>('');
  const [posicoesDisponiveis, setPosicoesDisponiveis] = useState<Array<{label: string, value: string}>>([]);
  
  const { signUp, clearCorruptedData, validateAndFixData } = useAuth();
  const router = useRouter();
  const { isDark } = useColorScheme();

  useEffect(() => {
    loadProfessors();
  }, []);

  useEffect(() => {
    if (selectedSport) {
      const posicoes = getSportPositions(selectedSport).map(pos => ({
        label: pos.charAt(0).toUpperCase() + pos.slice(1),
        value: pos
      }));
      setPosicoesDisponiveis(posicoes);
    }
  }, [selectedSport]);

  // Hook para limpar autofill quando a tela for focada
  useFocusEffect(
    React.useCallback(() => {
      // Força re-render para limpar qualquer estilo de autofill
      const timer = setTimeout(() => {
        // Força atualização dos estados para limpar autofill
        setName(name);
        setEmail(email);
        setPassword(password);
        setConfirmPassword(confirmPassword);
      }, 100);
      
      return () => clearTimeout(timer);
    }, [name, email, password, confirmPassword])
  );

  async function loadProfessors() {
    try {
      const storedUsers = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      // Filtrar apenas usuários do tipo professor
      const professorsList = users.filter((user: any) => 
        user.userType === 'professor' && user.email !== 'admin@teste.com'
      );
      
      // Adicionar professor padrão se não existir
      const defaultProfessor = {
        id: '1',
        name: 'Eric (Professor)',
        email: 'admin@teste.com',
        userType: 'professor'
      };
      
      // Verificar se o professor padrão já existe
      const hasDefaultProfessor = professorsList.some((prof: any) => prof.email === 'admin@teste.com');
      
      if (!hasDefaultProfessor) {
        professorsList.unshift(defaultProfessor);
      }
      
      setProfessors(professorsList);
    } catch (error) {
      console.log('Erro ao carregar professores:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de professores');
    }
  }

  const getSportPositions = (sport: string) => {
    const posicoes = {
      futebol: ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-Campo', 'Atacante'],
      basquete: ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'],
      volei: ['Levantador', 'Oposto', 'Ponteiro', 'Central', 'Líbero'],
      natacao: ['Nado Livre', 'Nado Costas', 'Nado Peito', 'Nado Borboleta', 'Medley'],
      tenis: ['Simples', 'Duplas'],
      boxe: ['Peso Mosca', 'Peso Galo', 'Peso Pena', 'Peso Leve', 'Peso Médio'],
      mma: ['Peso Palha', 'Peso Mosca', 'Peso Galo', 'Peso Pena', 'Peso Leve'],
      karate: ['Faixa Branca', 'Faixa Amarela', 'Faixa Verde', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
      judo: ['Faixa Branca', 'Faixa Amarela', 'Faixa Verde', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
      ciclismo: ['Estrada', 'Mountain Bike', 'BMX', 'Pista'],
      handebol: ['Goleiro', 'Ponta', 'Meio', 'Armador', 'Pivô'],
      rugby: ['Pilar', 'Hooker', 'Segunda Linha', 'Terceira Linha', 'Meio Scrum', 'Abertura', 'Centro', 'Ponta', 'Fullback'],
      golfe: ['Profissional', 'Amador'],
      surfe: ['Shortboard', 'Longboard', 'Bodyboard', 'SUP'],
      skate: ['Street', 'Vert', 'Park', 'Freestyle'],
      tenisMesa: ['Simples', 'Duplas'],
      badminton: ['Simples', 'Duplas'],
      esgrima: ['Florete', 'Espada', 'Sabre'],
      hipismo: ['Adestramento', 'Saltos', 'Concurso Completo']
    };
    return posicoes[sport as keyof typeof posicoes] || [];
  };

  async function handleSignUp() {
    if (!name || !email || !password || !confirmPassword || !userType) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos e selecione o tipo de usuário');
      return;
    }

    if (userType === 'atleta') {
      if (!selectedProfessor) {
        Alert.alert('Erro', 'Por favor, selecione um professor');
        return;
      }
      if (!selectedSport) {
        Alert.alert('Erro', 'Por favor, selecione um esporte');
        return;
      }
      if (!selectedPosicao) {
        Alert.alert('Erro', 'Por favor, selecione sua posição');
        return;
      }
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(name, email, password, userType, selectedProfessor, selectedSport, selectedPosicao);
      router.replace(userType === 'professor' ? '/(tabs)' : '/(atleta)');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  }

  const handleClearData = async () => {
    try {
      await clearCorruptedData();
      Alert.alert('Sucesso', 'Dados limpos com sucesso! Tente cadastrar novamente.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível limpar os dados.');
    }
  };

  const userTypes = [
    {
      type: 'professor' as const,
      title: 'Professor',
      subtitle: 'Gerenciar times, jogadores e estatísticas',
      icon: 'school',
      color: '#0066FF',
      backgroundColor: '#e3f2fd',
    },
    {
      type: 'atleta' as const,
      title: 'Atleta',
      subtitle: 'Acompanhar desempenho e receber orientações',
      icon: 'fitness',
      color: '#4CAF50',
      backgroundColor: '#e8f5e8',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Botão de debug - remover em produção */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={handleClearData}
      >
        <Text style={styles.debugButtonText}>🔧 Limpar Dados (Debug)</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={[
          styles.container,
          { backgroundColor: isDark ? Colors.dark.background : Colors.light.background },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#0066FF" />
            </TouchableOpacity>
            <Ionicons name="person-add" size={80} color="#0066FF" />
            <Text
              style={[styles.title, { color: isDark ? Colors.dark.text : Colors.light.text }]}
            >
              Criar Conta
            </Text>
            <Text
              style={[styles.subtitle, { color: isDark ? Colors.dark.icon : Colors.light.icon }]}
            >
              Escolha o tipo de perfil e preencha os dados
            </Text>
          </View>

          <View style={styles.form}>
            {/* Seleção de Tipo de Usuário */}
            <View style={styles.userTypeSection}>
              <Text style={styles.sectionTitle}>Tipo de Perfil</Text>
              <View style={styles.userTypeContainer}>
                {userTypes.map((type) => (
                  <TouchableOpacity
                    key={type.type}
                    style={[
                      styles.userTypeCard,
                      userType === type.type && styles.userTypeCardSelected,
                      { borderColor: userType === type.type ? type.color : '#e0e0e0' }
                    ]}
                    onPress={() => setUserType(type.type)}
                  >
                    <View style={[styles.userTypeIcon, { backgroundColor: type.backgroundColor }]}>
                      <Ionicons name={type.icon as any} size={32} color={type.color} />
                    </View>
                    <Text style={[
                      styles.userTypeTitle,
                      userType === type.type && { color: type.color }
                    ]}>
                      {type.title}
                    </Text>
                    <Text style={styles.userTypeSubtitle}>{type.subtitle}</Text>
                    {userType === type.type && (
                      <View style={[styles.selectedIndicator, { backgroundColor: type.color }]}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Seleção de Esporte (apenas para atletas) */}
            {userType === 'atleta' && (
              <View style={styles.sportSection}>
                <Text style={styles.sectionTitle}>Selecionar Esporte</Text>
                <Text style={styles.sectionSubtitle}>Escolha o esporte que você pratica</Text>
                <View style={styles.sportsContainer}>
                  {Object.values(SPORTS_CONFIG).map((sport) => (
                    <TouchableOpacity
                      key={sport.id}
                      style={[
                        styles.sportCard,
                        selectedSport === sport.id && styles.sportCardSelected
                      ]}
                      onPress={() => {
                        setSelectedSport(sport.id);
                        setSelectedPosicao(''); // Reset posição quando mudar o esporte
                      }}
                    >
                      <Ionicons 
                        name={sport.icon as any} 
                        size={32} 
                        color={selectedSport === sport.id ? sport.color : '#666'} 
                      />
                      <Text style={[
                        styles.sportName,
                        selectedSport === sport.id && { color: sport.color }
                      ]}>
                        {sport.name}
                      </Text>
                      {selectedSport === sport.id && (
                        <Ionicons name="checkmark-circle" size={20} color={sport.color} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Seleção de Posição */}
                {selectedSport && (
                  <View style={styles.posicaoSection}>
                    <Text style={styles.sectionTitle}>Sua Posição</Text>
                    <Text style={styles.sectionSubtitle}>
                      {selectedSport === 'jiujitsu' || selectedSport === 'judo' ? 'Selecione sua Faixa' :
                       selectedSport === 'capoeira' ? 'Selecione sua Corda' :
                       selectedSport === 'boxe' || selectedSport === 'mma' ? 'Selecione sua Categoria' :
                       'Selecione sua Posição'}
                    </Text>
                    <DropDownPicker
                      items={posicoesDisponiveis}
                      placeholder="Selecione sua posição"
                      open={openPosicao}
                      setOpen={setOpenPosicao}
                      value={selectedPosicao}
                      setValue={setSelectedPosicao}
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      zIndex={3000}
                      zIndexInverse={1000}
                      listMode="MODAL"
                    />
                  </View>
                )}
              </View>
            )}

            {/* Seleção de Professor (apenas para atletas) */}
            {userType === 'atleta' && (
              <View style={styles.professorSection}>
                <Text style={styles.sectionTitle}>Selecionar Professor</Text>
                <Text style={styles.sectionSubtitle}>Escolha o professor que irá acompanhar seu desempenho</Text>
                <View style={styles.professorsContainer}>
                  {professors.map((professor) => (
                    <TouchableOpacity
                      key={professor.id}
                      style={[
                        styles.professorCard,
                        selectedProfessor === professor.id && styles.professorCardSelected
                      ]}
                      onPress={() => setSelectedProfessor(professor.id)}
                    >
                      <View style={styles.professorInfo}>
                        <View style={styles.professorAvatar}>
                          <Ionicons name="person" size={24} color="#0066FF" />
                        </View>
                        <View style={styles.professorDetails}>
                          <Text style={styles.professorName}>{professor.name}</Text>
                          <Text style={styles.professorEmail}>{professor.email}</Text>
                        </View>
                      </View>
                      {selectedProfessor === professor.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Campos de Cadastro */}
            {userType && (
              <View style={styles.fieldsSection}>
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <AntiAutofillInput
                    style={styles.input}
                    placeholder="Nome completo"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={true}
                    editable={true}
                    selectTextOnFocus={true}
                    keyboardType="default"
                    textContentType="name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                  <AntiAutofillInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    selectTextOnFocus={true}
                    textContentType="emailAddress"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <AntiAutofillInput
                    style={styles.inputWithIcon}
                    placeholder="Senha (mín. 6 caracteres)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    selectTextOnFocus={true}
                    keyboardType="default"
                    textContentType="oneTimeCode"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <AntiAutofillInput
                    style={styles.inputWithIcon}
                    placeholder="Confirmar senha"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={true}
                    selectTextOnFocus={true}
                    keyboardType="default"
                    textContentType="oneTimeCode"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signUpButtonText}>
                      Criar Conta {userType === 'professor' ? 'de Professor' : 'de Atleta'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.linkText}>Faça login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  // Seções
  userTypeSection: {
    marginBottom: 30,
  },
  professorSection: {
    marginBottom: 30,
  },
  fieldsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  // Tipo de Usuário
  userTypeContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  userTypeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  userTypeCardSelected: {
    backgroundColor: '#f8f9ff',
  },
  userTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userTypeSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Esportes
  sportSection: {
    marginBottom: 30,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  sportCardSelected: {
    borderWidth: 3,
    backgroundColor: '#f8fff8',
  },
  sportName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  sportNameSelected: {
    color: '#4CAF50',
  },
  // Professores
  professorsContainer: {
    gap: 10,
  },
  professorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  professorCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  professorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  professorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  professorDetails: {
    flex: 1,
  },
  professorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  professorEmail: {
    fontSize: 12,
    color: '#666',
  },
  // Campos de Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 50,
    overflow: 'hidden',
    // Força fundo branco mais agressivamente
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 20,
    textAlignVertical: 'center',
    backgroundColor: '#fff',
    borderWidth: 0,
    outlineWidth: 0,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingRight: 10,
    minHeight: 20,
    textAlignVertical: 'center',
    backgroundColor: '#fff',
    borderWidth: 0,
    outlineWidth: 0,
  },
  eyeIcon: {
    padding: 5,
  },
  signUpButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonDisabled: {
    backgroundColor: '#ccc',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: 'bold',
  },
  posicaoSection: {
    marginTop: 20,
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
  debugButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: 10,
    backgroundColor: '#0066FF',
    borderRadius: 5,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 