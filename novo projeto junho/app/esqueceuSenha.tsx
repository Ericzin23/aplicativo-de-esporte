import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AnimatedView } from '../components/AnimatedView';
import { validateEmail, validateCPF, formatEmail, cleanCPF } from '../utils/validators';
import { getItem, StorageKeys } from '../utils/storage';

export default function EsqueceuSenhaScreen() {
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'loading' | 'found' | 'not-found' | null>(null);

  useEffect(() => {
    if (email && cpf) {
      setEmailStatus('loading');
      const timer = setTimeout(async () => {
        try {
          const listaUsuarios = await getItem<any[]>(StorageKeys.USUARIOS);
          if (listaUsuarios) {
            const usuarioEncontrado = listaUsuarios.find(u => 
              formatEmail(u.email) === formatEmail(email) && 
              cleanCPF(u.cpf) === cleanCPF(cpf)
            );
            
            if (usuarioEncontrado) {
              setEmailStatus('found');
              setSenha(usuarioEncontrado.senha);
              setModalVisible(true);
            } else {
              setEmailStatus('not-found');
            }
          }
        } catch (error) {
          console.error('Erro ao verificar dados:', error);
          setEmailStatus('not-found');
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEmailStatus(null);
    }
  }, [email, cpf]);

  const validateForm = () => {
    let isValid = true;

    // Validar email
    if (!email) {
      setEmailError('E-mail é obrigatório');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('E-mail inválido');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validar CPF
    if (!cpf) {
      setCpfError('CPF é obrigatório');
      isValid = false;
    } else if (!validateCPF(cpf)) {
      setCpfError('CPF inválido');
      isValid = false;
    } else {
      setCpfError('');
    }

    return isValid;
  };

  const handleRecuperarSenha = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);

      const listaUsuarios = await getItem<any[]>(StorageKeys.USUARIOS);
      if (!listaUsuarios || listaUsuarios.length === 0) {
        Alert.alert('Erro', 'Nenhum usuário cadastrado');
        return;
      }

      const usuarioEncontrado = listaUsuarios.find(u => 
        formatEmail(u.email) === formatEmail(email) && 
        cleanCPF(u.cpf) === cleanCPF(cpf)
      );

      if (!usuarioEncontrado) {
        Alert.alert('Erro', 'E-mail ou CPF não encontrados');
        return;
      }

      setSenha(usuarioEncontrado.senha);
      setModalVisible(true);
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      Alert.alert(
        'Erro',
        'Não foi possível recuperar a senha. Tente novamente mais tarde.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCPFInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return formatted;
  };

  const isFormValid = email && cpf && !emailError && !cpfError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <AnimatedView delay={0} style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1a237e" />
            </TouchableOpacity>
          </AnimatedView>

          <View style={styles.card}>
            <AnimatedView delay={100}>
              <Text style={styles.title}>Recuperar Senha</Text>
              <Text style={styles.subtitle}>
                Digite seu e-mail e CPF cadastrados para recuperar sua senha
              </Text>
            </AnimatedView>

            <AnimatedView delay={200} style={styles.inputContainer}>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Seu e-mail"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (text && !validateEmail(text)) {
                    setEmailError('E-mail inválido');
                  } else {
                    setEmailError('');
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </AnimatedView>

            <AnimatedView delay={300} style={styles.inputContainer}>
              <TextInput
                style={[styles.input, cpfError && styles.inputError]}
                placeholder="CPF"
                placeholderTextColor="#666"
                value={cpf}
                onChangeText={(text) => {
                  const formatted = formatCPFInput(text);
                  setCpf(formatted);
                  if (text && !validateCPF(formatted)) {
                    setCpfError('CPF inválido');
                  } else {
                    setCpfError('');
                  }
                }}
                keyboardType="numeric"
                maxLength={14}
              />
              {cpfError ? <Text style={styles.errorText}>{cpfError}</Text> : null}
            </AnimatedView>

            {emailStatus === 'loading' && (
              <Text style={styles.statusText}>Verificando...</Text>
            )}
            {emailStatus === 'found' && (
              <Text style={[styles.statusText, styles.statusFound]}>Dados encontrados</Text>
            )}
            {emailStatus === 'not-found' && (
              <Text style={[styles.statusText, styles.statusNotFound]}>Dados não encontrados</Text>
            )}

            <AnimatedView delay={400} style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, !isFormValid && styles.buttonDisabled]}
                onPress={handleRecuperarSenha}
                disabled={!isFormValid || loading}
              >
                <LinearGradient
                  colors={['#1a237e', '#283593', '#3949ab']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradient}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Verificando...' : 'Recuperar Senha'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </AnimatedView>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          router.replace('/login');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Senha Recuperada</Text>
            <Text style={styles.modalText}>Sua senha é:</Text>
            <Text style={styles.modalSenha}>{senha}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                router.replace('/login');
              }}
            >
              <Text style={styles.modalButtonText}>Voltar para Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  statusText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    textAlign: 'center',
  },
  statusFound: {
    color: '#4caf50',
  },
  statusNotFound: {
    color: '#f44336',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  modalSenha: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#1a237e',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 