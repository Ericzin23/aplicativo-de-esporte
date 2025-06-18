import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../contexts/AppDataContext';
import { AddTeamModal } from '../../components/AddTeamModal';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Team {
  id: string;
  name: string;
  sport: string;
  players: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
}

interface Player {
  id: string;
  name: string;
  sport: string;
  position: string;
  teamId: string;
  goals: number;
  assists: number;
  age: number;
  createdAt: string;
}

export default function Times() {
  const [searchText, setSearchText] = useState('');
  const [selectedSport, setSelectedSport] = useState('Todos');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const { teams, players, events, getPlayersByTeam, getTeamsBySport, updatePlayer, reloadData, debugStorage } = useAppData();

  // Recarregar dados quando a tela ganha foco (mas não muito frequentemente)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Tela Times ganhou foco');
      // Aguardar um pouco antes de recarregar para evitar conflitos
      const timeoutId = setTimeout(() => {
        reloadData(false); // Não forçar recarregamento
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }, [])
  );

  // Esportes disponíveis
  const sports = ['Todos', 'Futebol', 'Vôlei', 'Basquete', 'Futsal', 'Handebol'];

  // Filtrar times por esporte e busca
  const getFilteredTeams = () => {
    let filtered = teams;
    
    // Filtro por esporte
    if (selectedSport !== 'Todos') {
      const sportKey = selectedSport?.toLowerCase() || '';
      filtered = getTeamsBySport(sportKey);
    }
    
    // Filtro por busca
    if (searchText) {
      filtered = filtered.filter(team =>
        team.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredTeams = getFilteredTeams();

  const handleAddTeam = () => {
    setShowTeamModal(true);
  };

  const handleTeamPress = (team: Team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
  };

  const getTeamColor = (sport: string) => {
    if (!sport) return '#666';
    
    const sportLower = sport.toLowerCase();
    switch (sportLower) {
      case 'futebol': return '#4CAF50';
      case 'volei': case 'vôlei': return '#FF9800';
      case 'basquete': return '#FF5722';
      case 'futsal': return '#2196F3';
      case 'handebol': return '#9C27B0';
      default: return '#666';
    }
  };

  const getSportIcon = (sport: string) => {
    if (!sport) return 'fitness';
    
    const sportLower = sport.toLowerCase();
    switch (sportLower) {
      case 'futebol': return 'football';
      case 'volei': case 'vôlei': return 'basketball';
      case 'basquete': return 'basketball';
      case 'futsal': return 'football';
      case 'handebol': return 'basketball';
      default: return 'fitness';
    }
  };

  const getTeamStats = () => {
    const totalTeams = filteredTeams.length;
    const totalPlayers = filteredTeams.reduce((sum, team) => {
      const teamPlayers = getPlayersByTeam(team.id);
      return sum + teamPlayers.length;
    }, 0);
    const totalWins = filteredTeams.reduce((sum, team) => sum + team.wins, 0);
    
    return { totalTeams, totalPlayers, totalWins };
  };

  const stats = getTeamStats();

  const TeamDetailsModal = () => {
    if (!selectedTeam) return null;
    
    const teamPlayers = getPlayersByTeam(selectedTeam.id);
    const teamEvents = events.filter(event => 
      event.sport === selectedTeam.sport && 
      event.title?.toLowerCase().includes(selectedTeam.name?.toLowerCase() || '')
    );
    
    // Jogadores disponíveis (sem time ou do mesmo esporte)
    const availablePlayers = players.filter(player => 
      player.sport === selectedTeam.sport && 
      (player.teamId === '' || player.teamId === null || player.teamId === undefined)
    );
    
    const totalGames = selectedTeam.wins + selectedTeam.losses + selectedTeam.draws;
    const winPercentage = totalGames > 0 ? ((selectedTeam.wins / totalGames) * 100).toFixed(1) : '0';

    const addPlayerToTeam = async (playerId: string) => {
      try {
        console.log('➕ Adicionando jogador ao time:', playerId);
        await updatePlayer(playerId, { teamId: selectedTeam.id });
        
        // Aguardar um pouco antes de recarregar
        setTimeout(() => {
          reloadData(true); // Forçar recarregamento após mudança
        }, 200);
        
        Alert.alert('Sucesso!', 'Jogador adicionado ao time!');
      } catch (error) {
        console.error('❌ Erro ao adicionar jogador ao time:', error);
        Alert.alert('Erro', 'Não foi possível adicionar o jogador ao time.');
      }
    };

    const removePlayerFromTeam = async (playerId: string) => {
      try {
        console.log('➖ Removendo jogador do time:', playerId);
        await updatePlayer(playerId, { teamId: '' });
        
        // Aguardar um pouco antes de recarregar
        setTimeout(() => {
          reloadData(true); // Forçar recarregamento após mudança
        }, 200);
        
        Alert.alert('Sucesso!', 'Jogador removido do time!');
      } catch (error) {
        console.error('❌ Erro ao remover jogador do time:', error);
        Alert.alert('Erro', 'Não foi possível remover o jogador do time.');
      }
    };
    
    return (
      <Modal
        visible={showTeamDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTeamDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.teamDetailsModal}>
            <View style={styles.modalHeader}>
              <View style={styles.teamModalInfo}>
                <View style={[
                  styles.teamModalIcon, 
                  { backgroundColor: getTeamColor(selectedTeam.sport) }
                ]}>
                  <Ionicons 
                    name={getSportIcon(selectedTeam.sport) as any} 
                    size={24} 
                    color="#fff" 
                  />
                </View>
                <View>
                  <Text style={styles.teamModalName}>{selectedTeam.name}</Text>
                  <Text style={styles.teamModalSport}>
                    {selectedTeam.sport ? 
                      selectedTeam.sport.charAt(0).toUpperCase() + selectedTeam.sport.slice(1).toLowerCase() :
                      'Não definido'
                    }
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowTeamDetails(false)}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Estatísticas do Time */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>📊 Estatísticas</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: '#4CAF50' }]}>
                      {selectedTeam.wins}
                    </Text>
                    <Text style={styles.statCardLabel}>Vitórias</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: '#FF9800' }]}>
                      {selectedTeam.draws}
                    </Text>
                    <Text style={styles.statCardLabel}>Empates</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: '#F44336' }]}>
                      {selectedTeam.losses}
                    </Text>
                    <Text style={styles.statCardLabel}>Derrotas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={[styles.statCardValue, { color: '#2196F3' }]}>
                      {winPercentage}%
                    </Text>
                    <Text style={styles.statCardLabel}>Aproveitamento</Text>
                  </View>
                </View>
              </View>

              {/* Jogadores do Time */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  👥 Jogadores do Time ({teamPlayers.length})
                </Text>
                {teamPlayers.length > 0 ? (
                  teamPlayers.map((player) => (
                    <View key={player.id} style={styles.playerItem}>
                      <View style={styles.playerInfo}>
                        <View style={styles.playerAvatar}>
                          <Ionicons name="person" size={20} color="#666" />
                        </View>
                        <View>
                          <Text style={styles.playerName}>{player.name}</Text>
                          <Text style={styles.playerPosition}>{player.position}</Text>
                        </View>
                      </View>
                      <View style={styles.playerActions}>
                        <Text style={styles.playerStatText}>
                          {player.stats?.goals || 0}G {player.stats?.assists || 0}A
                        </Text>
                        <TouchableOpacity 
                          onPress={() => removePlayerFromTeam(player.id)}
                          style={styles.removePlayerButton}
                        >
                          <Ionicons name="remove-circle" size={20} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyPlayers}>
                    <Ionicons name="person-add-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyPlayersText}>Nenhum jogador no time</Text>
                  </View>
                )}
              </View>

              {/* Jogadores Disponíveis */}
              {availablePlayers.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    ➕ Jogadores Disponíveis ({availablePlayers.length})
                  </Text>
                  <Text style={styles.sectionDescription}>
                    Jogadores de {selectedTeam.sport} sem time que podem ser adicionados:
                  </Text>
                  {availablePlayers.map((player) => (
                    <View key={player.id} style={styles.availablePlayerItem}>
                      <View style={styles.playerInfo}>
                        <View style={styles.playerAvatar}>
                          <Ionicons name="person-add" size={20} color="#4CAF50" />
                        </View>
                        <View>
                          <Text style={styles.playerName}>{player.name}</Text>
                          <Text style={styles.playerPosition}>{player.position}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => addPlayerToTeam(player.id)}
                        style={styles.addPlayerButton}
                      >
                        <Ionicons name="add-circle" size={24} color="#4CAF50" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Eventos Relacionados */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  📅 Eventos Recentes ({teamEvents.length})
                </Text>
                {teamEvents.length > 0 ? (
                  teamEvents.slice(0, 5).map((event) => (
                    <View key={event.id} style={styles.eventItem}>
                      <View style={styles.eventIcon}>
                        <Ionicons 
                          name={event.type === 'jogo' ? 'football' : event.type === 'treino' ? 'fitness' : 'calendar'} 
                          size={16} 
                          color="#0066FF" 
                        />
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventDate}>
                          {new Date(event.date).toLocaleDateString('pt-BR')} - {event.time}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyEvents}>
                    <Ionicons name="calendar-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyEventsText}>Nenhum evento encontrado</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const handleRefresh = async () => {
    console.log('🔄 Refresh manual dos dados...');
    await reloadData(true); // Forçar recarregamento manual
  };

  const handleDebug = async () => {
    console.log('🔍 Executando debug manual...');
    await debugStorage();
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'Isso irá remover TODOS os dados salvos (times, jogadores, usuários). Tem certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              console.log('🗑️ AsyncStorage limpo completamente');
              await reloadData();
              Alert.alert('Sucesso', 'Todos os dados foram removidos');
            } catch (error) {
              console.error('❌ Erro ao limpar dados:', error);
              Alert.alert('Erro', 'Não foi possível limpar os dados');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Times</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="trash" size={20} color="#F44336" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.debugButton} onPress={handleDebug}>
            <Ionicons name="bug" size={20} color="#FF9800" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={20} color="#0066FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddTeam}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar times..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sport Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
        bounces={true}
      >
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.filterButton,
              selectedSport === sport && styles.filterButtonActive
            ]}
            onPress={() => setSelectedSport(sport)}
            activeOpacity={0.7}
          >
            {sport !== 'Todos' && (
              <Ionicons
                name={getSportIcon(sport) as any}
                size={16}
                color={selectedSport === sport ? '#fff' : getTeamColor(sport)}
                style={styles.filterIcon}
              />
            )}
            <Text style={[
              styles.filterText,
              selectedSport === sport && styles.filterTextActive
            ]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.totalTeams}</Text>
          <Text style={styles.summaryLabel}>Times</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.totalPlayers}</Text>
          <Text style={styles.summaryLabel}>Jogadores</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{stats.totalWins}</Text>
          <Text style={styles.summaryLabel}>Vitórias</Text>
        </View>
      </View>

      {/* Teams List */}
      <ScrollView style={styles.teamsList} showsVerticalScrollIndicator={false}>
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team) => {
            const teamPlayers = getPlayersByTeam(team.id);
            const totalGames = team.wins + team.losses + team.draws;
            const winPercentage = totalGames > 0 ? 
              ((team.wins * 3 + team.draws) / (totalGames * 3) * 100).toFixed(0) : '0';
            
            return (
              <TouchableOpacity
                key={`team-${team.id}`}
                style={styles.teamCard}
                onPress={() => handleTeamPress(team)}
                activeOpacity={0.7}
              >
                <View style={styles.teamInfo}>
                  <View style={[styles.teamIcon, { backgroundColor: getTeamColor(team.sport) }]}>
                    <Ionicons name={getSportIcon(team.sport) as any} size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamSport}>
                      {team.sport ? 
                        team.sport.charAt(0).toUpperCase() + team.sport.slice(1).toLowerCase() :
                        'Não definido'
                      }
                    </Text>
                  </View>
                </View>
                <View style={styles.teamStats}>
                  <Text style={styles.teamStatText}>
                    {team.wins}V {team.draws}E {team.losses}D
                  </Text>
                  <Text style={styles.teamPlayers}>{team.players} jogadores</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {teams.length === 0 
                ? 'Nenhum time cadastrado' 
                : searchText 
                  ? 'Nenhum time encontrado'
                  : `Nenhum time de ${selectedSport}`
              }
            </Text>
            {teams.length === 0 && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleAddTeam}
              >
                <Text style={styles.emptyButtonText}>Criar Primeiro Time</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <AddTeamModal 
        visible={showTeamModal} 
        onClose={() => setShowTeamModal(false)} 
      />

      <TeamDetailsModal />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    padding: 5,
  },
  debugButton: {
    padding: 5,
  },
  refreshButton: {
    padding: 5,
  },
  addButton: {
    backgroundColor: '#0066FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  filterContent: {
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  teamsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teamInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  teamSport: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamStatText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamPlayers: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  teamDetailsModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
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
  teamModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamModalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  teamModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  teamModalSport: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeModalButton: {
    padding: 5,
  },
  modalContent: {
    maxHeight: 500,
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalSectionTitle: {
    fontSize: 16,
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
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playerPosition: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  playerActions: {
    alignItems: 'flex-end',
  },
  playerStatText: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  removePlayerButton: {
    padding: 5,
  },
  emptyPlayers: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyPlayersText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyEvents: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyEventsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  availablePlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addPlayerButton: {
    padding: 5,
  },
}); 