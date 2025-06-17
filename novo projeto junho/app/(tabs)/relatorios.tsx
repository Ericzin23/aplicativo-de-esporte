import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAppData } from '../../contexts/AppDataContext';
import { Card, Divider, Button } from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { printToFileAsync } from 'expo-print';

export default function RelatoriosScreen() {
  const {
    teams = [],
    players = [],
    events = [],
    getPlayersByTeam,
    getStats,
  } = useAppData();

  const [loading, setLoading] = useState(true);
  const [relatorioData, setRelatorioData] = useState<any>(null);

  useEffect(() => {
    gerarRelatorio();
  }, [teams, players, events]);

  const gerarRelatorio = async () => {
    try {
      setLoading(true);

      const stats = getStats();
      const totalTimes = stats.totalTeams;
      const totalJogadores = stats.totalPlayers;
      const totalEventos = events.length;

      const esportes = teams.reduce((acc: any, team) => {
        const sport = team.sport || 'Não definido';
        acc[sport] = (acc[sport] || 0) + 1;
        return acc;
      }, {});

      const jogadoresPorTime = teams.map(team => ({
        id: team.id,
        name: team.name,
        count: getPlayersByTeam(team.id).length
      }));

      const estatisticasJogadores = players.map(player => {
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

      const eventosPorMes = events.reduce((acc: any, event) => {
        const mes = new Date(event.date).getMonth();
        acc[mes] = (acc[mes] || 0) + 1;
        return acc;
      }, {});

      const feedbacksJogadores = players
        .filter(p => p.feedbacks && p.feedbacks.length > 0)
        .map(p => ({
          id: p.id,
          name: p.name,
          feedbacks: p.feedbacks.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        }));

      setRelatorioData({
        totalTimes,
        totalJogadores,
        totalEventos,
        esportes,
        jogadoresPorTime,
        estatisticasJogadores,
        eventosPorMes,
        feedbacksJogadores
      });
    } catch (error) {
      Alert.alert('Erro ao gerar relatório', error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #0066FF; }
              h2 { color: #333; margin-top: 30px; }
              .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0; }
              .feedback { border-left: 3px solid #0066FF; padding-left: 10px; margin: 10px 0; }
              .professor { font-weight: bold; color: #0066FF; }
              .data { font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <h1>Relatório Geral - Gestão de Times</h1>
            
            <div class="stats">
              <h2>Estatísticas Gerais</h2>
              <p><strong>Times:</strong> ${relatorioData.totalTimes}</p>
              <p><strong>Jogadores:</strong> ${relatorioData.totalJogadores}</p>
              <p><strong>Eventos:</strong> ${relatorioData.totalEventos}</p>
            </div>

            <h2>Feedbacks dos Jogadores</h2>
            ${relatorioData.feedbacksJogadores.map(jogador => `
              <h3>${jogador.name}</h3>
              ${jogador.feedbacks.map(fb => `
                <div class="feedback">
                  <div class="professor">${fb.professor}</div>
                  <div>${fb.mensagem}</div>
                  <div class="data">${new Date(fb.data).toLocaleString()}</div>
                </div>
              `).join('')}
            `).join('')}

            <div style="margin-top: 30px; font-size: 12px; color: #666;">
              Relatório gerado em: ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);

    } catch (error) {
      Alert.alert('Erro ao exportar relatório', error.message);
    }
  };

  if (loading || !relatorioData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Relatório Geral</Text>

      <Card style={styles.card}>
        <Card.Title title="Times" />
        <Card.Content>
          <Text style={styles.statValue}>{relatorioData.totalTimes}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Jogadores" />
        <Card.Content>
          <Text style={styles.statValue}>{relatorioData.totalJogadores}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Eventos" />
        <Card.Content>
          <Text style={styles.statValue}>{relatorioData.totalEventos}</Text>
        </Card.Content>
      </Card>

      <Text style={styles.subtitle}>Feedbacks dos Jogadores</Text>
      {relatorioData.feedbacksJogadores.map((jogador: any) => (
        <Card key={jogador.id} style={styles.card}>
          <Card.Title title={jogador.name} />
          <Card.Content>
            {jogador.feedbacks.map((fb: any, idx: number) => (
              <View key={idx} style={styles.feedbackItem}>
                <Text style={styles.professorName}>{fb.professor}</Text>
                <Text style={styles.feedbackMessage}>{fb.mensagem}</Text>
                <Text style={styles.feedbackDate}>
                  {new Date(fb.data).toLocaleString()}
                </Text>
                <Divider style={styles.divider} />
              </View>
            ))}
          </Card.Content>
        </Card>
      ))}

      <Button 
        mode="contained" 
        style={styles.exportButton} 
        onPress={exportarRelatorio}
        icon="download"
      >
        Exportar Relatório
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066FF',
    textAlign: 'center',
  },
  feedbackItem: {
    marginBottom: 8,
  },
  professorName: {
    fontWeight: 'bold',
    color: '#0066FF',
    fontSize: 14,
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    marginVertical: 8,
  },
  exportButton: {
    marginTop: 20,
    marginBottom: 30,
  },
}); 