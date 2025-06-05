import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSportConfig, getSportStatistics, getSportPositions } from '../../utils/sportsConfig';

interface EstatisticasDetalhadas {
  [key: string]: any;
  minutosJogados: number;
  aproveitamento: number;
  posicao: string;
  time: string;
  esporte: string;
  ultimosJogos: {
    data: string;
    adversario: string;
    stats: { [key: string]: number };
    nota: number;
  }[];
}

export default function EstatisticasAtleta() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EstatisticasDetalhadas>({
    minutosJogados: 0,
    aproveitamento: 0,
    posicao: 'Não definida',
    time: 'Sem time',
    esporte: user?.sport || 'Não definido',
    ultimosJogos: [],
  });
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');

  useEffect(() => {
    loadEstatisticas();
  }, []);

  async function loadEstatisticas() {
    try {
      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      const atletaPlayer = players.find((p: any) => 
        p.name === user?.name || p.email === user?.email
      );
      
      if (atletaPlayer) {
        const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
        const teams = storedTeams ? JSON.parse(storedTeams) : [];
        const team = teams.find((t: any) => t.id === atletaPlayer.teamId);
        
        // Carregar estatísticas baseadas no esporte
        const storedStats = await AsyncStorage.getItem(`@GestaoTimes:player_stats_${atletaPlayer.id}`);
        const playerStats = storedStats ? JSON.parse(storedStats) : {};
        
        const sportConfig = getSportConfig(user?.sport || 'futebol');
        const sportStats: any = {};
        
        if (sportConfig) {
          sportConfig.statistics.forEach(stat => {
            sportStats[stat.key] = playerStats[stat.key] || 0;
          });
        }

        // Verificar se a posição é válida para o esporte
        const posicoesValidas = getSportPositions(user?.sport || 'futebol');
        const posicao = atletaPlayer.position && posicoesValidas.includes(atletaPlayer.position)
          ? atletaPlayer.position
          : 'Não definida';
        
        setStats({
          ...sportStats,
          minutosJogados: playerStats.minutosJogados || 0,
          aproveitamento: playerStats.aproveitamento || 0,
          posicao: posicao,
          time: team?.name || 'Sem time',
          esporte: user?.sport || 'Não definido',
          ultimosJogos: playerStats.ultimosJogos || [],
        });
      } else {
        // Inicializar com dados zerados baseados no esporte
        const sportConfig = getSportConfig(user?.sport || 'futebol');
        const sportStats: any = {};
        
        if (sportConfig) {
          sportConfig.statistics.forEach(stat => {
            sportStats[stat.key] = 0;
          });
        }
        
        setStats({
          ...sportStats,
          minutosJogados: 0,
          aproveitamento: 0,
          posicao: 'Não definida',
          time: 'Aguardando convite para time',
          esporte: user?.sport || 'Não definido',
          ultimosJogos: [],
        });
      }
    } catch (error) {
      console.log('Erro ao carregar estatísticas:', error);
    }
  }

  const periodos = [
    { label: 'Este Mês', value: 'mes' },
    { label: 'Temporada', value: 'temporada' },
    { label: 'Carreira', value: 'carreira' },
  ];

  const getNotaColor = (nota: number) => {
    if (nota >= 8) return '#4CAF50';
    if (nota >= 7) return '#FF9800';
    return '#F44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Seletor de Período */}
        <View style={styles.periodSelector}>
          {periodos.map((periodo) => (
            <TouchableOpacity
              key={periodo.value}
              style={[
                styles.periodButton,
                periodoSelecionado === periodo.value && styles.periodButtonActive
              ]}
              onPress={() => setPeriodoSelecionado(periodo.value)}
            >
              <Text style={[
                styles.periodButtonText,
                periodoSelecionado === periodo.value && styles.periodButtonTextActive
              ]}>
                {periodo.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estatísticas Principais */}
        <View style={styles.mainStatsSection}>
          <Text style={styles.sectionTitle}>Estatísticas Principais - {stats.esporte}</Text>
          {Object.keys(stats).length > 0 ? (
            <View style={styles.statsGrid}>
              {getSportStatistics(user?.sport || 'futebol').map((stat, index) => {
                const jogos = stats.jogos || stats.sets || stats.partidas || 1;
                const media = jogos > 0 ? (stats[stat.key] / jogos) : 0;
                
                return (
                  <View key={stat.key} style={styles.statCard}>
                    <Ionicons name={stat.icon as any} size={32} color={stat.color} />
                    <Text style={styles.statNumber}>{stats[stat.key] || 0}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statAverage}>
                      {stat.key === 'jogos' || stat.key === 'sets' || stat.key === 'partidas' 
                        ? `${stats.minutosJogados} min` 
                        : `Média: ${media.toFixed(1)}/jogo`
                      }
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="stats-chart" size={32} color="#ccc" />
              <Text style={styles.noDataText}>Aguardando registro de estatísticas pelo professor</Text>
            </View>
          )}
        </View>

        {/* Gráfico de Desempenho */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Desempenho por Jogo</Text>
          {stats.ultimosJogos.length > 0 ? (
            <>
              <View style={styles.performanceChart}>
                {stats.ultimosJogos.map((jogo, index) => (
                  <View key={index} style={styles.gameBar}>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            height: `${(jogo.nota / 10) * 100}%`,
                            backgroundColor: getNotaColor(jogo.nota)
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.gameDate}>{jogo.data}</Text>
                    <Text style={styles.gameNote}>{jogo.nota}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <Text style={styles.legendText}>Notas dos últimos 5 jogos</Text>
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="trending-up" size={32} color="#ccc" />
              <Text style={styles.noDataText}>Aguardando registro de jogos</Text>
            </View>
          )}
        </View>

        {/* Últimos Jogos Detalhados */}
        <View style={styles.gamesSection}>
          <Text style={styles.sectionTitle}>Últimos Jogos</Text>
          {stats.ultimosJogos.length > 0 ? (
            stats.ultimosJogos.map((jogo, index) => (
              <View key={index} style={styles.gameCard}>
                <View style={styles.gameHeader}>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameDate}>{jogo.data}</Text>
                    <Text style={styles.gameOpponent}>vs {jogo.adversario}</Text>
                  </View>
                  <View style={[
                    styles.gameNote,
                    { backgroundColor: getNotaColor(jogo.nota) + '20' }
                  ]}>
                    <Text style={[
                      styles.gameNoteText,
                      { color: getNotaColor(jogo.nota) }
                    ]}>
                      {jogo.nota}
                    </Text>
                  </View>
                </View>
                <View style={styles.gameStats}>
                  {Object.entries(jogo.stats).map(([key, value]) => (
                    <View key={key} style={styles.gameStat}>
                      <Ionicons name={getSportStatistics(user?.sport || 'futebol').find(s => s.key === key)?.icon as any} size={16} color="#4CAF50" />
                      <Text style={styles.gameStatText}>{value} {key}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="football" size={32} color="#ccc" />
              <Text style={styles.noDataText}>Aguardando registro de jogos</Text>
            </View>
          )}
        </View>

        {/* Comparação com o Time */}
        <View style={styles.comparisonSection}>
          <Text style={styles.sectionTitle}>Comparação com o Time</Text>
          {stats.time !== 'Sem time' ? (
            <View style={styles.comparisonCard}>
              {getSportStatistics(user?.sport || 'futebol').map((stat, index) => (
                <View key={stat.key} style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>{stat.label} no Time</Text>
                  <View style={styles.comparisonBar}>
                    <View style={[styles.comparisonFill, { width: `${stats[`${stat.key}Rank`] || 0}%` }]} />
                  </View>
                  <Text style={styles.comparisonValue}>{stats[`${stat.key}Position`] || 'N/A'}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="people" size={32} color="#ccc" />
              <Text style={styles.noDataText}>Aguardando convite para time</Text>
            </View>
          )}
        </View>

        {/* Metas e Objetivos */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>Metas da Temporada</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalItem}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Gols na Temporada</Text>
                <Text style={styles.goalProgress}>{stats.gols}/15 gols</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View style={[
                  styles.goalProgressFill,
                  { width: `${(stats.gols / 15) * 100}%` }
                ]} />
              </View>
            </View>
            <View style={styles.goalItem}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Assistências na Temporada</Text>
                <Text style={styles.goalProgress}>{stats.assistencias}/10 assist.</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View style={[
                  styles.goalProgressFill,
                  { width: `${(stats.assistencias / 10) * 100}%` }
                ]} />
              </View>
            </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  mainStatsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statAverage: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  performanceSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  performanceChart: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  gameBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    width: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 10,
    minHeight: 10,
  },
  gameDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gameNote: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLegend: {
    alignItems: 'center',
    marginTop: 10,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  gamesSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameOpponent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gameNoteText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameStats: {
    flexDirection: 'row',
    gap: 20,
  },
  gameStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameStatText: {
    fontSize: 14,
    color: '#666',
  },
  comparisonSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  comparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  comparisonItem: {
    marginBottom: 16,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  comparisonBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  comparisonFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  comparisonValue: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  goalsSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  goalItem: {
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  goalProgress: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
}); 