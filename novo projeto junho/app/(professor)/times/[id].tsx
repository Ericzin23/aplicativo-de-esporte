import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../contexts/AuthContext';
import { getSportConfig } from '../../../utils/sportsConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ICON_SIZE = width * 0.15;

interface Team {
  id: string;
  name: string;
  sport: string;
  players: any[];
  createdAt: string;
}

export default function TimeDetalhes() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, [id]);

  async function loadTeam() {
    try {
      setIsLoading(true);
      const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
      const allTeams = storedTeams ? JSON.parse(storedTeams) : [];
      
      const foundTeam = allTeams.find((t: Team) => t.id === id);
      
      if (foundTeam) {
        setTeam(foundTeam);
      } else {
        Alert.alert('Erro', 'Time não encontrado');
        router.back();
      }
    } catch (error) {
      console.log('Erro ao carregar time:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do time');
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando dados do time...</Text>
      </View>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{team.name}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {/* Editar time */}}
        >
          <Ionicons name="pencil" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Informações do Time */}
      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <View style={[
            styles.teamIcon,
            { backgroundColor: getSportColor(team.sport) + '20' }
          ]}>
            <Ionicons 
              name={getSportIcon(team.sport)} 
              size={ICON_SIZE * 0.6} 
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
        </View>

        {/* Lista de Jogadores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogadores</Text>
          {team.players.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                Nenhum jogador adicionado ao time
              </Text>
            </View>
          ) : (
            team.players.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.playerCard}
                onPress={() => {/* Ver detalhes do jogador */}}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerPosition}>{player.position}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#666" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Botão de Adicionar Jogador */}
      <TouchableOpacity 
        style={styles.addPlayerButton}
        onPress={() => {/* Adicionar jogador */}}
      >
        <Ionicons name="person-add" size={24} color="#fff" />
        <Text style={styles.addPlayerText}>Adicionar Jogador</Text>
      </TouchableOpacity>
    </View>
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  playerPosition: {
    fontSize: 14,
    color: '#666',
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  addPlayerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 