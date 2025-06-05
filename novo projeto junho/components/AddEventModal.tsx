import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppData } from '../contexts/AppDataContext';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate?: string;
}

const eventTypes = [
  { label: 'Jogo', value: 'jogo' },
  { label: 'Treino', value: 'treino' },
  { label: 'Reunião', value: 'reuniao' },
];

const sports = [
  { label: 'Futebol', value: 'futebol' },
  { label: 'Vôlei', value: 'volei' },
  { label: 'Basquete', value: 'basquete' },
  { label: 'Futsal', value: 'futsal' },
  { label: 'Handebol', value: 'handebol' },
];

export function AddEventModal({ visible, onClose, selectedDate }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'jogo' | 'treino' | 'reuniao'>('jogo');
  const [sport, setSport] = useState('futebol');
  const [date, setDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [time, setTime] = useState(new Date());
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addEvent } = useAppData();

  const locationInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    console.log('🚀 Tentando adicionar evento:', { title, type, sport, date, time, description, location });
    
    if (!title.trim()) {
      Alert.alert('Erro', 'Por favor, digite o título do evento.');
      return;
    }

    try {
      setLoading(true);
      
      const eventDate = date.toISOString().split('T')[0];
      const eventTime = time.toTimeString().slice(0, 5);

      await addEvent({
        title: title.trim(),
        type,
        sport,
        date: eventDate,
        time: eventTime,
        description: description.trim(),
        location: location.trim(),
      });
      
      Alert.alert('Sucesso!', 'Evento criado com sucesso!');
      resetForm();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      Alert.alert('Erro', 'Não foi possível criar o evento.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('jogo');
    setSport('futebol');
    setDate(selectedDate ? new Date(selectedDate) : new Date());
    setTime(new Date());
    setDescription('');
    setLocation('');
  };

  const handleClose = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleTitleSubmit = () => {
    locationInputRef.current?.focus();
  };

  const handleLocationSubmit = () => {
    descriptionInputRef.current?.focus();
  };

  const handleDescriptionSubmit = () => {
    Keyboard.dismiss();
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
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Novo Evento</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {/* Título */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Título do Evento *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o título do evento"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                returnKeyType="next"
                onSubmitEditing={handleTitleSubmit}
                blurOnSubmit={false}
              />
            </View>

            {/* Esporte */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Esporte *</Text>
              <View style={styles.optionsContainer}>
                {sports.map((sportOption) => (
                  <TouchableOpacity
                    key={sportOption.value}
                    style={[
                      styles.optionButton,
                      sport === sportOption.value && styles.optionButtonSelected
                    ]}
                    onPress={() => setSport(sportOption.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      sport === sportOption.value && styles.optionTextSelected
                    ]}>
                      {sportOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tipo de Evento */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Evento *</Text>
              <View style={styles.optionsContainer}>
                {eventTypes.map((eventType) => (
                  <TouchableOpacity
                    key={eventType.value}
                    style={[
                      styles.optionButton,
                      type === eventType.value && styles.optionButtonSelected
                    ]}
                    onPress={() => setType(eventType.value as 'jogo' | 'treino' | 'reuniao')}
                  >
                    <Text style={[
                      styles.optionText,
                      type === eventType.value && styles.optionTextSelected
                    ]}>
                      {eventType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Data e Horário */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Data *</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {date.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Horário *</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {time.toTimeString().slice(0, 5)}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Local */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Local</Text>
              <TextInput
                ref={locationInputRef}
                style={styles.input}
                placeholder="Digite o local do evento"
                value={location}
                onChangeText={setLocation}
                maxLength={100}
                returnKeyType="next"
                onSubmitEditing={handleLocationSubmit}
                blurOnSubmit={false}
              />
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.input, styles.textArea]}
                placeholder="Digite uma descrição para o evento"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
                returnKeyType="done"
                onSubmitEditing={handleDescriptionSubmit}
              />
            </View>
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
                loading && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[
                styles.submitButtonText,
                loading && styles.submitButtonTextDisabled
              ]}>
                {loading ? 'Criando Evento...' : 'Criar Evento'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
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
    maxHeight: 400,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionButtonSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
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
    fontSize: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
}); 