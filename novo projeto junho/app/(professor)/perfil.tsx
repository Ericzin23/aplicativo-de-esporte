import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function PerfilProfessor() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    try {
      // Carregar imagem do perfil
      const savedImage = await AsyncStorage.getItem(`@GestaoTimes:profile_image_${user?.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log('Erro ao carregar dados do perfil:', error);
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

  const handleSave = async () => {
    try {
      await updateProfile({ name, email });
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#0066FF" />
          </TouchableOpacity>
          <Text style={styles.title}>Perfil do Professor</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons 
              name={isEditing ? "close" : "create"} 
              size={24} 
              color="#0066FF" 
            />
          </TouchableOpacity>
        </View>

        {/* Profile Picture */}
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

        {/* Profile Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Digite seu nome"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
              />
            </View>
          </View>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 5,
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0066FF',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  cameraButtonDisabled: {
    opacity: 0.5,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  changePhotoButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  changePhotoText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
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
}); 