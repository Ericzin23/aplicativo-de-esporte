import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAppData } from '../../contexts/AppDataContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Card, Divider, List, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function RelatoriosScreen() {
  const { 
    teams = [], 
    players = [], 
    events = [],
    getPlayersByTeam,
    getStats
  } = useAppData();
  const [loading, setLoading] = useState(true);
  const [relatorioData, setRelatorioData] = useState<any>(null);

  useEffect(() => {
    gerarRelatorio();
  }, [teams, players, events]);

  const gerarRelatorio = async () => {
    try {
      setLoading(true);

      // Estatísticas gerais
      const stats = getStats();
      const totalTimes = stats.totalTeams;
      const totalJogadores = stats.totalPlayers;
      const totalEventos = events.length;

      // Estatísticas por esporte
      const esportes = teams.reduce((acc: any, team) => {
        const sport = team.sport || 'Não definido';
        acc[sport] = (acc[sport] || 0) + 1;
        return acc;
      }, {});

      // Estatísticas de jogadores por time
      const jogadoresPorTime = teams.map(team => ({
        id: team.id,
        name: team.name,
        count: getPlayersByTeam(team.id).length
      }));

      // Estatísticas de gols e assistências
      const estatisticasJogadores = players.map(player => {
        // Garantir que o objeto stats existe e tem valores padrão
        const defaultStats = {
          goals: 0,
          assists: 0,
          games: 0,
          cards: 0
        };
        
        const playerStats = player.stats || defaultStats;
        
        return {
          id: player.id,
          name: player.name,
          goals: playerStats.goals || 0,
          assists: playerStats.assists || 0
        };
      });

      // Eventos por mês
      const eventosPorMes = events.reduce((acc: any, event) => {
        const mes = new Date(event.date).getMonth();
        acc[mes] = (acc[mes] || 0) + 1;
        return acc;
      }, {});

      setRelatorioData({
        totalTimes,
        totalJogadores,
        totalEventos,
        esportes,
        jogadoresPorTime,
        estatisticasJogadores,
        eventosPorMes
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = async () => {
    try {
      const message = `
        Relatório de Estatísticas
        
        Times: ${relatorioData?.totalTimes || 0}
        Jogadores: ${relatorioData?.totalJogadores || 0}
        Eventos: ${relatorioData?.totalEventos || 0}
        
        Top Jogadores:
        ${(relatorioData?.estatisticasJogadores || [])
          .sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0))
          .slice(0, 5)
          .map((j: any) => `${j.name}: ${j.goals || 0} gols, ${j.assists || 0} assistências`)
          .join('\n')}
      `;

      await Share.share({
        message,
        title: 'Relatório de Estatísticas'
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Relatórios',
          headerRight: () => (
            <TouchableOpacity onPress={exportarRelatorio}>
              <Ionicons name="download-outline" size={24} color="#0066FF" />
            </TouchableOpacity>
          )
        }} 
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Estatísticas Gerais */}
          <Card style={styles.card}>
            <Card.Title title="Estatísticas Gerais" />
            <Card.Content>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="account-group" size={24} color="#0066FF" />
                  <Text style={styles.statValue}>{relatorioData?.totalTimes || 0}</Text>
                  <Text style={styles.statLabel}>Times</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="account" size={24} color="#0066FF" />
                  <Text style={styles.statValue}>{relatorioData?.totalJogadores || 0}</Text>
                  <Text style={styles.statLabel}>Jogadores</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="calendar" size={24} color="#0066FF" />
                  <Text style={styles.statValue}>{relatorioData?.totalEventos || 0}</Text>
                  <Text style={styles.statLabel}>Eventos</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Gráfico de Esportes */}
          <Card style={styles.card}>
            <Card.Title title="Times por Esporte" />
            <Card.Content>
              <PieChart
                data={Object.entries(relatorioData?.esportes || {}).map(([key, value], index) => ({
                  name: key,
                  population: value as number,
                  color: getRandomColor(),
                  legendFontColor: '#7F7F7F',
                  legendFontSize: 12,
                  key: `sport-${key}-${index}-${Date.now()}`
                }))}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
              />
            </Card.Content>
          </Card>

          {/* Gráfico de Jogadores por Time */}
          <Card style={styles.card}>
            <Card.Title title="Jogadores por Time" />
            <Card.Content>
              <BarChart
                data={{
                  labels: (relatorioData?.jogadoresPorTime || []).map((t: any) => t.name),
                  datasets: [{
                    data: (relatorioData?.jogadoresPorTime || []).map((t: any) => t.count)
                  }]
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
                }}
                style={styles.chart}
              />
            </Card.Content>
          </Card>

          {/* Top Jogadores */}
          <Card style={styles.card}>
            <Card.Title title="Top Jogadores" />
            <Card.Content>
              <List.Section>
                {(relatorioData?.estatisticasJogadores || [])
                  .sort((a: any, b: any) => (b.goals || 0) - (a.goals || 0))
                  .slice(0, 5)
                  .map((jogador: any) => (
                    <List.Item
                      key={`player-${jogador.id}`}
                      title={jogador.name}
                      description={`${jogador.goals || 0} gols • ${jogador.assists || 0} assistências`}
                      left={props => <List.Icon {...props} icon="trophy" />}
                    />
                  ))}
              </List.Section>
            </Card.Content>
          </Card>

          {/* Eventos por Mês */}
          <Card style={styles.card}>
            <Card.Title title="Eventos por Mês" />
            <Card.Content>
              <LineChart
                data={{
                  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                  datasets: [{
                    data: Object.values(relatorioData?.eventosPorMes || {})
                  }]
                }}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
                }}
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Função auxiliar para gerar cores aleatórias
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 