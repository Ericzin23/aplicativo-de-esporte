import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSportConfig, getSportStatistics, getSportPositions } from '../../utils/sportsConfig';
import OrientacaoItem, { Orientacao } from '../../components/OrientacaoItem';

interface AtletaStats {
  [key: string]: any;
  posicao: string;
  time: string;
  esporte: string;
  jogos: number;
  gols: number;
  assistencias: number;
  cartoes: number;
}


export default function AtletaHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [atletaStats, setAtletaStats] = useState<AtletaStats>({
    posicao: 'Aguardando definição do professor',
    time: 'Aguardando definição do professor',
    esporte: user?.sport || 'futebol',
    jogos: 0,
    gols: 0,
    assistencias: 0,
    cartoes: 0
  });
  const [orientacoes, setOrientacoes] = useState<Orientacao[]>([]);
  const [proximoTreino, setProximoTreino] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAtletaData();
  }, []);

  async function loadAtletaData() {
    try {
      setIsLoading(true);
      // Carregar imagem do perfil
      const savedImage = await AsyncStorage.getItem(`@GestaoTimes:profile_image_${user?.id}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }

      // Carregar dados do jogador
      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      const atletaPlayer = players.find((p: any) => 
        p.name === user?.name || p.email === user?.email
      );
      
      if (atletaPlayer) {
        // Carregar dados do time apenas se o atleta estiver em um time
        let timeInfo = 'Aguardando definição do professor';
        if (atletaPlayer.teamId) {
          const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
          const teams = storedTeams ? JSON.parse(storedTeams) : [];
          const team = teams.find((t: any) => t.id === atletaPlayer.teamId);
          if (team) {
            timeInfo = team.name;
          }
        }

        // Verificar se a posição é válida para o esporte
        const posicoesValidas = getSportPositions(user?.sport || 'futebol');
        const posicao = atletaPlayer.position && posicoesValidas.includes(atletaPlayer.position)
          ? atletaPlayer.position
          : 'Aguardando definição do professor';
        
        // Carregar estatísticas reais baseadas no esporte
        const storedStats = await AsyncStorage.getItem(`@GestaoTimes:player_stats_${atletaPlayer.id}`);
        const stats = storedStats ? JSON.parse(storedStats) : {};
        
        const sportConfig = getSportConfig(user?.sport || 'futebol');
        const sportStats: any = {};
        
        if (sportConfig) {
          sportConfig.statistics.forEach(stat => {
            sportStats[stat.key] = stats[stat.key] || 0;
          });
        }
        
        setAtletaStats({
          posicao: posicao,
          time: timeInfo,
          esporte: user?.sport || atletaPlayer.sport,
          jogos: sportStats.jogos || 0,
          gols: sportStats.gols || 0,
          assistencias: sportStats.assistencias || 0,
          cartoes: sportStats.cartoes || 0
        });

        // Carregar orientações do professor (apenas as que foram enviadas)
        const storedOrientacoes = await AsyncStorage.getItem(`@GestaoTimes:orientacoes_${user?.id}`);
        const orientacoesList = storedOrientacoes ? JSON.parse(storedOrientacoes) : [];
        setOrientacoes(orientacoesList);

        // Carregar próximo treino apenas se estiver em um time
        const storedEvents = await AsyncStorage.getItem('@GestaoTimes:events');
        const events = storedEvents ? JSON.parse(storedEvents) : [];
        
        if (atletaPlayer) {
          const proximoEvento = events
            .filter((event: any) => event.teamId === atletaPlayer.teamId)
            .filter((event: any) => new Date(event.date) >= new Date())
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
          
          if (proximoEvento) {
            setProximoTreino({
              data: new Date(proximoEvento.date).toLocaleDateString('pt-BR'),
              horario: proximoEvento.time,
              local: proximoEvento.location || 'Local a definir',
              tipo: proximoEvento.type
            });
          } else {
            setProximoTreino(null);
          }
        } else {
          setProximoTreino(null);
        }
      }
    } catch (error) {
      console.log('Erro ao carregar dados do atleta:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const marcarOrientacaoLida = async (id: string) => {
    const novasOrientacoes = orientacoes.map(o => 
      o.id === id ? { ...o, lida: true } : o
    );
    setOrientacoes(novasOrientacoes);
    
    try {
      await AsyncStorage.setItem(
        `@GestaoTimes:orientacoes_${user?.id}`,
        JSON.stringify(novasOrientacoes)
      );
    } catch (error) {
      console.log('Erro ao salvar orientação:', error);
    }
  };

  const getOrientacaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'dica': return 'bulb';
      case 'alerta': return 'warning';
      case 'elogio': return 'trophy';
      default: return 'information-circle';
    }
  };

  const getOrientacaoColor = (tipo: string) => {
    switch (tipo) {
      case 'dica': return '#2196F3';
      case 'alerta': return '#FF9800';
      case 'elogio': return '#4CAF50';
      default: return '#666';
    }
  };

  const orientacaoNaoLidas = orientacoes.filter(o => !o.lida);
  const orientacoesOrdenadas = [...orientacoes].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  );
  const orientacaoDestaque = orientacoesOrdenadas[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header de Boas-vindas */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Olá, {user?.name?.split(' ')[0]}</Text>
            <Text style={styles.subtitle}>Bem-vindo de volta!</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/perfil')}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Próximo Treino */}
        {proximoTreino && (
          <View style={styles.nextTrainingCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={24} color="#4CAF50" />
              <Text style={styles.cardTitle}>Próximo Treino</Text>
            </View>
            <View style={styles.trainingInfo}>
              <Text style={styles.trainingDate}>{proximoTreino.data}</Text>
              <Text style={styles.trainingDetails}>
                {proximoTreino.horario} - {proximoTreino.local}
              </Text>
            </View>
          </View>
        )}

        {/* Estatísticas Rápidas */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Minhas Estatísticas - {atletaStats.esporte}</Text>
          <View style={styles.statsGrid}>
            {getSportStatistics(user?.sport || 'futebol').slice(0, 4).map((stat, index) => (
              <View key={stat.key} style={styles.statCard}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                <Text style={styles.statNumber}>{atletaStats[stat.key] || 0}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Informações do Atleta */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Meus Dados</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={styles.infoLabel}>Posição:</Text>
              <Text style={[styles.infoValue, atletaStats.posicao === 'Aguardando definição do professor' ? styles.pendingValue : null]}>
                {atletaStats.posicao}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={[styles.infoValue, atletaStats.time === 'Aguardando definição do professor' ? styles.pendingValue : null]}>
                {atletaStats.time}
              </Text>
            </View>
          </View>
        </View>

        {/* Orientações do Professor */}
        <View style={styles.orientacoesSection}>
          <Text style={styles.sectionTitle}>Orientações do Professor</Text>
          {orientacaoDestaque ? (
            <View style={styles.orientacoesList}>
              <OrientacaoItem
                orientacao={orientacaoDestaque}
                highlight
                onMarkAsRead={marcarOrientacaoLida}
              />
            </View>
          ) : (
            <View style={styles.noOrientacoesCard}>
              <Ionicons name="information-circle-outline" size={24} color="#666" />
              <Text style={styles.noOrientacoesText}>
                Aguardando orientações do professor
              </Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.verTodasButton}
            onPress={() => router.push('/orientacoes')}
          >
            <Text style={styles.verTodasText}>Ver todas as orientações</Text>
            <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(atleta)/estatisticas')}
            >
              <Ionicons name="stats-chart" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Ver Estatísticas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(atleta)/agenda')}
            >
              <Ionicons name="calendar" size={32} color="#2196F3" />
              <Text style={styles.actionText}>Minha Agenda</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(atleta)/orientacoes')}
            >
              <Ionicons name="school" size={32} color="#FF9800" />
              <Text style={styles.actionText}>Orientações</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(atleta)/perfil')}
            >
              <Ionicons name="person" size={32} color="#9C27B0" />
              <Text style={styles.actionText}>Meu Perfil</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextTrainingCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  trainingInfo: {
    marginLeft: 32,
  },
  trainingDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  trainingDetails: {
    fontSize: 14,
    color: '#666',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
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
    minWidth: '22%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pendingValue: {
    fontStyle: 'italic',
    color: '#666',
  },
  orientacoesSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  orientacoesList: {
    marginBottom: 15,
  },
  noOrientacoesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noOrientacoesText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  verTodasButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verTodasText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
}); 