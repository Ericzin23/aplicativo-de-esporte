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
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../../contexts/AppDataContext';
import { AddPlayerModal } from '../../components/AddPlayerModal';

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

export default function Jogadores() {
  const [searchText, setSearchText] = useState('');
  const [selectedSport, setSelectedSport] = useState('Todos');
  const [selectedPosition, setSelectedPosition] = useState('Todos');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { players, teams, getPlayersByPosition, getPlayersBySport } = useAppData();

  const sports = ['Todos', 'Futebol', 'Vôlei', 'Basquete', 'Futsal', 'Handebol'];

  const sportsPositions: { [key: string]: string[] } = {
    futebol: ['Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Volante', 'Meio-campo', 'Meia-atacante', 'Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centroavante'],
    volei: ['Levantador', 'Oposto', 'Central', 'Ponteiro', 'Líbero'],
    basquete: ['Armador', 'Ala-armador', 'Ala', 'Ala-pivô', 'Pivô'],
    futsal: ['Goleiro', 'Fixo', 'Ala Direita', 'Ala Esquerda', 'Pivô'],
    handebol: ['Goleiro', 'Armador Central', 'Armador Lateral', 'Meia', 'Ponta', 'Pivô'],
  };

  // Obter posições baseadas no esporte selecionado
  const getAvailablePositions = () => {
    if (selectedSport === 'Todos') {
      const allPositions = Object.values(sportsPositions).flat();
      return ['Todos', ...Array.from(new Set(allPositions))];
    }
    const sportKey = selectedSport.toLowerCase();
    return ['Todos', ...(sportsPositions[sportKey] || [])];
  };

  const filteredPlayers = players.filter(player => {
    const team = teams.find(t => t.id === player.teamId);
    const matchesSearch = player.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         (team?.name.toLowerCase().includes(searchText.toLowerCase()) || false);
    
    const matchesSport = selectedSport === 'Todos' || 
                        player.sport === selectedSport.toLowerCase() ||
                        (selectedSport === 'Futebol' && player.sport === 'futebol') ||
                        (selectedSport === 'Vôlei' && player.sport === 'volei') ||
                        (selectedSport === 'Basquete' && player.sport === 'basquete') ||
                        (selectedSport === 'Futsal' && player.sport === 'futsal') ||
                        (selectedSport === 'Handebol' && player.sport === 'handebol');
    
    const matchesPosition = selectedPosition === 'Todos' || player.position === selectedPosition;
    
    return matchesSearch && matchesSport && matchesPosition;
  });

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setShowPlayerModal(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowPlayerModal(true);
  };

  const handlePlayerPress = (player: Player) => {
    const team = teams.find(t => t.id === player.teamId);
    const sportLabel = sports.find(s => s.toLowerCase() === player.sport) || player.sport;
    
    Alert.alert(
      player.name,
      `Esporte: ${sportLabel}\nPosição: ${player.position}\nTime: ${team?.name || 'Sem time'}\nIdade: ${player.age} anos\nGols: ${player.goals}\nAssistências: ${player.assists}`,
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Editar', onPress: () => handleEditPlayer(player) }
      ]
    );
  };

  const handleCloseModal = () => {
    setShowPlayerModal(false);
    setEditingPlayer(null);
  };

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'futebol': return 'football';
      case 'volei': return 'basketball'; // Usando basketball como aproximação
      case 'basquete': return 'basketball';
      case 'futsal': return 'football';
      case 'handebol': return 'basketball';
      default: return 'fitness';
    }
  };

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

  const getPositionIcon = (position: string) => {
    // Ícones para futebol/futsal
    if (['Goleiro'].includes(position)) return 'shield';
    if (['Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Fixo'].includes(position)) return 'person-outline';
    if (['Volante', 'Meio-campo', 'Meia-atacante'].includes(position)) return 'football';
    if (['Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centroavante', 'Pivô'].includes(position)) return 'flash';
    
    // Ícones para vôlei
    if (['Levantador'].includes(position)) return 'hand-left';
    if (['Oposto', 'Central', 'Ponteiro'].includes(position)) return 'trending-up';
    if (['Líbero'].includes(position)) return 'shield-checkmark';
    
    // Ícones para basquete
    if (['Armador', 'Ala-armador'].includes(position)) return 'play';
    if (['Ala', 'Ala-pivô'].includes(position)) return 'swap-horizontal';
    
    // Ícones para handebol
    if (['Armador Central', 'Armador Lateral', 'Meia', 'Ponta'].includes(position)) return 'hand-right';
    
    return 'person';
  };

  const getPositionColor = (position: string) => {
    // Cores para futebol/futsal
    if (['Goleiro'].includes(position)) return '#FF9800';
    if (['Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Fixo'].includes(position)) return '#4CAF50';
    if (['Volante', 'Meio-campo', 'Meia-atacante'].includes(position)) return '#2196F3';
    if (['Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centroavante', 'Pivô'].includes(position)) return '#F44336';
    
    // Cores para vôlei
    if (['Levantador'].includes(position)) return '#9C27B0';
    if (['Oposto', 'Central', 'Ponteiro'].includes(position)) return '#FF5722';
    if (['Líbero'].includes(position)) return '#607D8B';
    
    // Cores para basquete
    if (['Armador', 'Ala-armador'].includes(position)) return '#3F51B5';
    if (['Ala', 'Ala-pivô'].includes(position)) return '#FF9800';
    
    // Cores para handebol
    if (['Armador Central', 'Armador Lateral', 'Meia', 'Ponta'].includes(position)) return '#795548';
    
    return '#666';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Jogadores</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddPlayer}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar jogadores ou times..."
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
            onPress={() => {
              setSelectedSport(sport);
              setSelectedPosition('Todos'); // Reset position filter when changing sport
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              selectedSport === sport && styles.filterTextActive
            ]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Position Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.positionFilterContainer}
        contentContainerStyle={styles.filterContent}
        bounces={true}
      >
        {getAvailablePositions().map((position) => (
          <TouchableOpacity
            key={position}
            style={[
              styles.positionFilterButton,
              selectedPosition === position && styles.positionFilterButtonActive
            ]}
            onPress={() => setSelectedPosition(position)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.positionFilterText,
              selectedPosition === position && styles.positionFilterTextActive
            ]}>
              {position}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredPlayers.length}</Text>
          <Text style={styles.summaryLabel}>Jogadores</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredPlayers.reduce((sum, player) => sum + player.goals, 0)}</Text>
          <Text style={styles.summaryLabel}>Gols</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredPlayers.reduce((sum, player) => sum + player.assists, 0)}</Text>
          <Text style={styles.summaryLabel}>Assistências</Text>
        </View>
      </View>

      {/* Players List */}
      <ScrollView 
        style={styles.playersList} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => {
            const team = teams.find(t => t.id === player.teamId);
            const sportLabel = sports.find(s => s.toLowerCase() === player.sport) || player.sport;
            
            return (
              <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() => handlePlayerPress(player)}
                activeOpacity={0.7}
              >
                <View style={styles.playerHeader}>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerAvatar}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerTeam}>{team?.name || 'Sem time'}</Text>
                      <View style={styles.tagsContainer}>
                        <View style={[styles.sportTag, { backgroundColor: getSportColor(player.sport) }]}>
                          <Ionicons
                            name={getSportIcon(player.sport) as any}
                            size={12}
                            color="#fff"
                          />
                          <Text style={styles.sportTagText}>
                            {typeof sportLabel === 'string' ? sportLabel.charAt(0).toUpperCase() + sportLabel.slice(1) : player.sport}
                          </Text>
                        </View>
                        <View style={styles.positionContainer}>
                          <Ionicons
                            name={getPositionIcon(player.position) as any}
                            size={14}
                            color={getPositionColor(player.position)}
                          />
                          <Text style={[styles.playerPosition, { color: getPositionColor(player.position) }]}>
                            {player.position}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.playerAge}>
                    <Text style={styles.ageText}>{player.age}</Text>
                    <Text style={styles.ageLabel}>anos</Text>
                  </View>
                </View>
                
                <View style={styles.playerStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{player.goals}</Text>
                    <Text style={styles.statLabel}>Gols</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{player.assists}</Text>
                    <Text style={styles.statLabel}>Assistências</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => handleEditPlayer(player)}
                  >
                    <Ionicons name="create-outline" size={20} color="#0066FF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhum jogador encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 'Tente ajustar sua busca' : 'Adicione jogadores para começar'}
            </Text>
            {!searchText && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddPlayer}>
                <Text style={styles.emptyButtonText}>Adicionar Primeiro Jogador</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <AddPlayerModal
        visible={showPlayerModal}
        onClose={handleCloseModal}
        editingPlayer={editingPlayer}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#0066FF',
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  positionFilterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  positionFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  positionFilterButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  positionFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  positionFilterTextActive: {
    color: '#2196F3',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  playersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sportTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerPosition: {
    fontSize: 12,
    fontWeight: '600',
  },
  playerAge: {
    alignItems: 'center',
  },
  ageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ageLabel: {
    fontSize: 10,
    color: '#666',
  },
  playerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 