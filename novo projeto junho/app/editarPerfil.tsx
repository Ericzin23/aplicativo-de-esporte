import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getItem, setItem, StorageKeys } from '../utils/storage';
import { formatPhone } from '../utils/validators';

export default function EditarPerfil() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [nome, setNome] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telefone, setTelefone] = useState('');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [lateralidade, setLateralidade] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imagem, setImagem] = useState<string | null>(user?.avatar || null);
  const [esporte, setEsporte] = useState('');
  const [posicao, setPosicao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDadosPerfil();
  }, []);

  const carregarDadosPerfil = async () => {
    try {
      const dadosProfissionais = await getItem(StorageKeys.DADOS_PROFISSIONAIS) as any;
      if (dadosProfissionais) {
        setEsporte(dadosProfissionais.esporte || '');
        setPosicao(dadosProfissionais.posicao || '');
        setDescricao(dadosProfissionais.descricao || '');
      }

      const dadosCadastro = await getItem(StorageKeys.DADOS_CADASTRO) as any;
      if (dadosCadastro) {
        setTelefone(dadosCadastro.telefone || '');
        setAltura(dadosCadastro.altura || '');
        setPeso(dadosCadastro.peso || '');
        setLateralidade(dadosCadastro.lateralidade || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do perfil:', error);
    }
  };

  const escolherImagem = async () => {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!resultado.canceled && resultado.assets[0]) {
        setImagem(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao escolher imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const salvarPerfil = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome.');
      return;
    }

    try {
      setLoading(true);

      // Atualizar dados do usuário no contexto de autenticação
      await updateProfile({ 
        name: nome, 
        email,
        avatar: imagem || undefined
      });

      // Salvar dados profissionais
      const dadosProfissionais = {
        esporte,
        posicao,
        descricao,
        dataAtualizacao: new Date().toISOString()
      };
      await setItem(StorageKeys.DADOS_PROFISSIONAIS, dadosProfissionais);

      // Salvar dados pessoais
      const dadosCadastro = {
        nome,
        email,
        telefone,
        altura,
        peso,
        lateralidade,
        dataAtualizacao: new Date().toISOString()
      };
      await setItem(StorageKeys.DADOS_CADASTRO, dadosCadastro);

      // Salvar foto se houver
      if (imagem) {
        await setItem(StorageKeys.FOTO_PERFIL, imagem);
      }

      Alert.alert('Sucesso!', 'Perfil atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#0066FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {/* Foto de Perfil */}
          <TouchableOpacity onPress={escolherImagem} style={styles.avatarContainer}>
            {imagem ? (
              <Image source={{ uri: imagem }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="camera" size={40} color="#666" />
                <Text style={styles.profilePlaceholderText}>Adicionar Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          {/* Email (Travado) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
            />
          </View>

          {/* Telefone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(XX) XXXXX-XXXX"
              placeholderTextColor="#999"
              value={telefone}
              onChangeText={(text) => setTelefone(formatPhone(text))}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {/* Altura */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Altura (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 180"
              placeholderTextColor="#999"
              value={altura}
              onChangeText={setAltura}
              keyboardType="numeric"
            />
          </View>

          {/* Peso */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 75"
              placeholderTextColor="#999"
              value={peso}
              onChangeText={setPeso}
              keyboardType="numeric"
            />
          </View>

          {/* Lateralidade */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lateralidade</Text>
            <View style={styles.lateralidadeContainer}>
              {['Destro', 'Canhoto', 'Ambidestro'].map((opcao) => (
                <TouchableOpacity
                  key={opcao}
                  style={[
                    styles.lateralidadeButton,
                    lateralidade === opcao && styles.lateralidadeButtonSelected
                  ]}
                  onPress={() => setLateralidade(opcao)}
                >
                  <Text style={[
                    styles.lateralidadeText,
                    lateralidade === opcao && styles.lateralidadeTextSelected
                  ]}>
                    {opcao}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Esporte */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Esporte Principal</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Futebol, Basquete, Vôlei..."
              placeholderTextColor="#999"
              value={esporte}
              onChangeText={setEsporte}
            />
          </View>

          {/* Posição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Posição / Faixa / Categoria</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Goleiro, Faixa Preta, Peso Leve..."
              placeholderTextColor="#999"
              value={posicao}
              onChangeText={setPosicao}
            />
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição Pessoal</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Fale um pouco sobre você..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={descricao}
              onChangeText={setDescricao}
              textAlignVertical="top"
            />
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={salvarPerfil}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Salvando...' : 'Salvar Perfil'}
            </Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0066FF',
    borderStyle: 'dashed',
  },
  profilePlaceholderText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#0066FF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  lateralidadeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  lateralidadeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066FF',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lateralidadeButtonSelected: {
    backgroundColor: '#0066FF',
  },
  lateralidadeText: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  lateralidadeTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#0066FF',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});