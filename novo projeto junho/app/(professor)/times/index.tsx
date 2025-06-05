import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../contexts/AuthContext';
import { getSportConfig, getSportPositions } from '../../../utils/sportsConfig';
import { useRouter } from 'expo-router';

interface Team {
  id: string;
  name: string;
  sport: string;
  players: any[];
  createdAt: string;
}

export default function Times() {
  const router = useRouter();
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    try {
      setIsLoading(true);
      const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
      const allTeams = storedTeams ? JSON.parse(storedTeams) : [];
      
      // Filtrar times do professor logado
      const professorTeams = allTeams.filter((team: Team) => team.professorId === user?.id);
      setTeams(professorTeams);
    } catch (error) {
      console.log('Erro ao carregar times:', error);
      Alert.alert('Erro', 'Não foi possível carregar os times');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddTeam() {
    if (!newTeamName.trim() || !newTeamSport) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      const newTeam: Team = {
        id: Date.now().toString(),
        name: newTeamName.trim(),
        sport: newTeamSport,
        players: [],
        createdAt: new Date().toISOString(),
        professorId: user?.id
      };

      const updatedTeams = [...teams, newTeam];
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      setTeams(updatedTeams);
      setModalVisible(false);
      setNewTeamName('');
      setNewTeamSport('');
    } catch (error) {
      console.log('Erro ao adicionar time:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o time');
    }
  }

  async function handleDeleteTeam(teamId: string) {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este time?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedTeams = teams.filter(team => team.id !== teamId);
              await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
              setTeams(updatedTeams);
            } catch (error) {
              console.log('Erro ao excluir time:', error);
              Alert.alert('Erro', 'Não foi possível excluir o time');
            }
          }
        }
      ]
    );
  }

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'futebol':
        return 'football';
      case 'basquete':
        return 'basketball';
      case 'volei':
        return 'tennisball';
      case 'handball':
        return 'hand-left';
      default:
        return 'trophy';
    }
  };

  const getSportColor = (sport: string) => {
    const config = getSportConfig(sport);
    return config?.color || '#4CAF50';
  };

  const filteredTeams = teams.filter(team => {
    const matchesSport = !selectedSport || team.sport === selectedSport;
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const sports = ['futebol', 'basquete', 'volei', 'handball'];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando times...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar times..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtro de Esportes */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.sportsFilter}
      >
        <TouchableOpacity
          style={[
            styles.sportChip,
            !selectedSport && styles.sportChipSelected
          ]}
          onPress={() => setSelectedSport(null)}
        >
          <Text style={[
            styles.sportChipText,
            !selectedSport && styles.sportChipTextSelected
          ]}>Todos</Text>
        </TouchableOpacity>
        
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.sportChip,
              selectedSport === sport && styles.sportChipSelected,
              { borderColor: getSportColor(sport) }
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Ionicons 
              name={getSportIcon(sport)} 
              size={16} 
              color={selectedSport === sport ? '#fff' : getSportColor(sport)} 
              style={styles.sportChipIcon}
            />
            <Text style={[
              styles.sportChipText,
              selectedSport === sport && styles.sportChipTextSelected
            ]}>
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Times */}
      <ScrollView style={styles.teamsList}>
        {filteredTeams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {selectedSport 
                ? `Nenhum time de ${selectedSport} encontrado`
                : 'Nenhum time encontrado'}
            </Text>
          </View>
        ) : (
          filteredTeams.map((team) => (
            <TouchableOpacity
              key={team.id}
              style={styles.teamCard}
              onPress={() => router.push(`/times/${team.id}`)}
            >
              <View style={[
                styles.teamIcon,
                { backgroundColor: getSportColor(team.sport) + '20' }
              ]}>
                <Ionicons 
                  name={getSportIcon(team.sport)} 
                  size={24} 
                  color={getSportColor(team.sport)} 
                />
              </View>
              
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamSport}>
                  {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}
                </Text>
                <Text style={styles.teamPlayers}>
                  {team.players.length} {team.players.length === 1 ? 'jogador' : 'jogadores'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTeam(team.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Botão de Adicionar Time */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal de Adicionar Time */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Time</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nome do time"
              value={newTeamName}
              onChangeText={setNewTeamName}
            />

            <Text style={styles.modalLabel}>Esporte</Text>
            <View style={styles.sportsGrid}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportOption,
                    newTeamSport === sport && styles.sportOptionSelected,
                    { borderColor: getSportColor(sport) }
                  ]}
                  onPress={() => setNewTeamSport(sport)}
                >
                  <Ionicons 
                    name={getSportIcon(sport)} 
                    size={24} 
                    color={newTeamSport === sport ? '#fff' : getSportColor(sport)} 
                  />
                  <Text style={[
                    styles.sportOptionText,
                    newTeamSport === sport && styles.sportOptionTextSelected
                  ]}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewTeamName('');
                  setNewTeamSport('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddTeam}
              >
                <Text style={styles.confirmButtonText}>Criar Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  sportsFilter: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  sportChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  sportChipIcon: {
    marginRight: 4,
  },
  sportChipText: {
    fontSize: 14,
    color: '#666',
  },
  sportChipTextSelected: {
    color: '#fff',
  },
  teamsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamSport: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  teamPlayers: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 24,
  },
  sportOption: {
    width: '48%',
    margin: '1%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  sportOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  sportOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  sportOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
}); 