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
import { useAppData } from '../contexts/AppDataContext';

interface Player {
  id: string;
  name: string;
  sport: string;
  position: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    goals: number;
    assists: number;
    games: number;
    cards: number;
  };
  profile: {
    age: number;
    height?: string;
    weight?: string;
    photo?: string;
  };
}

interface AddPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  editingPlayer?: Player | null;
}

const sportsPositions = {
  futebol: ['Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Volante', 'Meio-campo', 'Meia-atacante', 'Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centroavante'],
  volei: ['Levantador', 'Oposto', 'Central', 'Ponteiro', 'Líbero'],
  basquete: ['Armador', 'Ala-armador', 'Ala', 'Ala-pivô', 'Pivô'],
  futsal: ['Goleiro', 'Fixo', 'Ala Direita', 'Ala Esquerda', 'Pivô'],
  handebol: ['Goleiro', 'Armador Central', 'Armador Lateral', 'Meia', 'Ponta', 'Pivô'],
};

const sports = [
  { label: 'Futebol', value: 'futebol' },
  { label: 'Vôlei', value: 'volei' },
  { label: 'Basquete', value: 'basquete' },
  { label: 'Futsal', value: 'futsal' },
  { label: 'Handebol', value: 'handebol' },
];

export function AddPlayerModal({ visible, onClose, editingPlayer }: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState<keyof typeof sportsPositions>('futebol');
  const [position, setPosition] = useState('');
  const [teamId, setTeamId] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const { addPlayer, updatePlayer, teams } = useAppData();

  const ageInputRef = useRef<TextInput>(null);

  // Carregar dados do jogador quando estiver editando
  React.useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name);
      setSport(editingPlayer.sport as keyof typeof sportsPositions);
      setPosition(editingPlayer.position);
      setTeamId(editingPlayer.teamId);
      setAge(editingPlayer.profile.age.toString());
    } else {
      resetForm();
    }
  }, [editingPlayer, visible]);

  // Atualizar posição quando mudar o esporte
  React.useEffect(() => {
    if (sport && sportsPositions[sport] && !editingPlayer) {
      setPosition(sportsPositions[sport][0]);
    }
  }, [sport, editingPlayer]);

  const handleSubmit = async () => {
    console.log('🚀 Tentando salvar jogador:', { name, sport, position, teamId, age, editing: !!editingPlayer });
    
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, digite o nome do jogador.');
      return;
    }

    if (!teamId) {
      Alert.alert('Erro', 'Por favor, selecione um time.');
      return;
    }

    if (!age || isNaN(Number(age)) || Number(age) < 16 || Number(age) > 50) {
      Alert.alert('Erro', 'Por favor, digite uma idade válida (16-50 anos).');
      return;
    }

    try {
      setLoading(true);
      
      const playerData = {
        name: name.trim(),
        sport,
        position,
        teamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          goals: editingPlayer?.stats?.goals || 0,
          assists: editingPlayer?.stats?.assists || 0,
          games: editingPlayer?.stats?.games || 0,
          cards: editingPlayer?.stats?.cards || 0
        },
        profile: {
          age: Number(age),
          height: editingPlayer?.profile?.height?.toString(),
          weight: editingPlayer?.profile?.weight?.toString(),
          photo: editingPlayer?.profile?.photo
        }
      };

      if (editingPlayer) {
        await updatePlayer(editingPlayer.id, playerData);
        Alert.alert('Sucesso!', 'Jogador atualizado com sucesso!');
      } else {
        await addPlayer(playerData);
        Alert.alert('Sucesso!', 'Jogador adicionado com sucesso!');
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar jogador:', error);
      Alert.alert('Erro', `Não foi possível ${editingPlayer ? 'atualizar' : 'adicionar'} o jogador.`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSport('futebol');
    setPosition(sportsPositions.futebol[0]);
    setTeamId('');
    setAge('');
  };

  const handleClose = () => {
    Keyboard.dismiss();
    if (!editingPlayer) {
      resetForm();
    }
    onClose();
  };

  const handleNameSubmit = () => {
    ageInputRef.current?.focus();
  };

  const handleAgeSubmit = () => {
    Keyboard.dismiss();
  };

  if (!visible) return null;

  const availablePositions = sportsPositions[sport] || [];
  const filteredTeams = teams.filter(team => team.sport === sport);
  const isEditing = !!editingPlayer;

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
            <Text style={styles.title}>
              {isEditing ? 'Editar Jogador' : 'Novo Jogador'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Jogador *</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome do jogador"
                value={name}
                onChangeText={setName}
                maxLength={50}
                returnKeyType="next"
                onSubmitEditing={handleNameSubmit}
                blurOnSubmit={false}
              />
            </View>

            {/* Idade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Idade *</Text>
              <TextInput
                ref={ageInputRef}
                style={styles.input}
                placeholder="Digite a idade"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="done"
                onSubmitEditing={handleAgeSubmit}
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
                    onPress={() => setSport(sportOption.value as keyof typeof sportsPositions)}
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

            {/* Posição */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Posição *</Text>
              <View style={styles.optionsContainer}>
                {availablePositions.map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.optionButton,
                      position === pos && styles.optionButtonSelected
                    ]}
                    onPress={() => setPosition(pos)}
                  >
                    <Text style={[
                      styles.optionText,
                      position === pos && styles.optionTextSelected
                    ]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time *</Text>
              {filteredTeams && filteredTeams.length > 0 ? (
                <View style={styles.optionsContainer}>
                  {filteredTeams.map((team) => (
                    <TouchableOpacity
                      key={team.id}
                      style={[
                        styles.optionButton,
                        teamId === team.id && styles.optionButtonSelected
                      ]}
                      onPress={() => setTeamId(team.id)}
                    >
                      <Text style={[
                        styles.optionText,
                        teamId === team.id && styles.optionTextSelected
                      ]}>
                        {team.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noTeamsText}>
                  ⚠️ Nenhum time de {sports.find(s => s.value === sport)?.label} encontrado. Crie um time primeiro na aba &quot;Times&quot;.
                </Text>
              )}
            </View>

            {/* Estatísticas (apenas na edição) */}
            {isEditing && editingPlayer && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>📊 Estatísticas</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{editingPlayer.stats.goals}</Text>
                    <Text style={styles.statLabel}>Gols</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{editingPlayer.stats.assists}</Text>
                    <Text style={styles.statLabel}>Assistências</Text>
                  </View>
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
                (loading || !filteredTeams || filteredTeams.length === 0) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || !filteredTeams || filteredTeams.length === 0}
            >
              <Text style={[
                styles.submitButtonText,
                (loading || !filteredTeams || filteredTeams.length === 0) && styles.submitButtonTextDisabled
              ]}>
                {loading ? (isEditing ? 'Salvando...' : 'Adicionando...') : (isEditing ? 'Salvar Alterações' : 'Adicionar Jogador')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  noTeamsText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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