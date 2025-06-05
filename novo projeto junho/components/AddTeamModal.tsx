import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../contexts/AppDataContext';

interface AddTeamModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddTeamModal({ visible, onClose }: AddTeamModalProps) {
  const [name, setName] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTeam } = useAppData();

  // Esportes disponíveis
  const sports = [
    { label: 'Futebol', value: 'futebol', icon: 'football' },
    { label: 'Vôlei', value: 'volei', icon: 'basketball' },
    { label: 'Basquete', value: 'basquete', icon: 'basketball' },
    { label: 'Futsal', value: 'futsal', icon: 'football' },
    { label: 'Handebol', value: 'handebol', icon: 'basketball' },
  ];

  const getSportColor = (sport: string) => {
    switch (sport) {
      case 'futebol': return '#4CAF50';
      case 'volei': return '#FF9800';
      case 'basquete': return '#FF5722';
      case 'futsal': return '#2196F3';
      case 'handebol': return '#9C27B0';
      default: return '#666';
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, digite o nome do time.');
      return;
    }

    if (!selectedSport) {
      Alert.alert('Erro', 'Por favor, selecione um esporte.');
      return;
    }

    try {
      setLoading(true);
      await addTeam({
        name: name.trim(),
        sport: selectedSport,
        players: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      });
      
      Alert.alert('Sucesso!', 'Time criado com sucesso!');
      setName('');
      setSelectedSport('');
      onClose();
    } catch (error) {
      console.error('Erro ao criar time:', error);
      Alert.alert('Erro', 'Não foi possível criar o time.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedSport('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Novo Time</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Nome do Time */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome do Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o nome do time"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  maxLength={50}
                  returnKeyType="next"
                />
              </View>

              {/* Seleção de Esporte */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Esporte *</Text>
                <View style={styles.sportsContainer}>
                  {sports.map((sport) => (
                    <TouchableOpacity
                      key={sport.value}
                      style={[
                        styles.sportButton,
                        selectedSport === sport.value && [
                          styles.sportButtonActive,
                          { backgroundColor: getSportColor(sport.value) }
                        ]
                      ]}
                      onPress={() => setSelectedSport(sport.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={sport.icon as any}
                        size={20}
                        color={selectedSport === sport.value ? '#fff' : getSportColor(sport.value)}
                      />
                      <Text style={[
                        styles.sportButtonText,
                        selectedSport === sport.value && styles.sportButtonTextActive
                      ]}>
                        {sport.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Informações do Esporte Selecionado */}
              {selectedSport && (
                <View style={styles.sportInfo}>
                  <View style={[styles.sportInfoHeader, { backgroundColor: getSportColor(selectedSport) + '20' }]}>
                    <Ionicons
                      name={sports.find(s => s.value === selectedSport)?.icon as any}
                      size={16}
                      color={getSportColor(selectedSport)}
                    />
                    <Text style={[styles.sportInfoText, { color: getSportColor(selectedSport) }]}>
                      Time de {sports.find(s => s.value === selectedSport)?.label}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.submitButton,
                  (!name.trim() || !selectedSport) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading || !name.trim() || !selectedSport}
              >
                <Text style={[
                  styles.submitButtonText,
                  (!name.trim() || !selectedSport) && styles.submitButtonTextDisabled
                ]}>
                  {loading ? 'Criando...' : 'Criar Time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  sportButtonActive: {
    borderColor: 'transparent',
  },
  sportButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sportButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sportInfo: {
    marginTop: 10,
  },
  sportInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  sportInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
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
  submitButton: {
    backgroundColor: '#0066FF',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
}); 