import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppData } from '../contexts/AppDataContext';

export default function Relatorios() {
  const router = useRouter();
  const { teams = [], players = [], events = [] } = useAppData();

  // Calcular estatísticas
  const totalGols = players.reduce((sum, player) => sum + (player.stats?.goals || 0), 0);
  const totalAssistencias = players.reduce((sum, player) => sum + (player.stats?.assists || 0), 0);
  
  // Top artilheiros
  const topScorers = players
    .filter(player => (player.stats?.goals || 0) > 0)
    .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
    .slice(0, 5);

  // Top assistentes
  const topAssisters = players
    .filter(player => (player.stats?.assists || 0) > 0)
    .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
    .slice(0, 5);

  // Estatísticas por posição
  const positionStats = players.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = { count: 0, goals: 0, assists: 0 };
    }
    acc[player.position].count++;
    acc[player.position].goals += player.stats?.goals || 0;
    acc[player.position].assists += player.stats?.assists || 0;
    return acc;
  }, {} as Record<string, { count: number; goals: number; assists: number }>);

  // Eventos por tipo
  const eventStats = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExport = () => {
    Alert.alert(
      'Exportar Relatório',
      'Funcionalidade de exportação em desenvolvimento. Em breve você poderá exportar os relatórios em PDF.',
      [{ text: 'OK' }]
    );
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Sem time';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios</Text>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#0066FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={true}>
        {/* Resumo Geral */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{teams.length}</Text>
              <Text style={styles.statLabel}>Times</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{players.length}</Text>
              <Text style={styles.statLabel}>Jogadores</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalGols}</Text>
              <Text style={styles.statLabel}>Gols</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalAssistencias}</Text>
              <Text style={styles.statLabel}>Assistências</Text>
            </View>
          </View>
        </View>

        {/* Top Artilheiros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Artilheiros</Text>
          <View style={styles.rankingContainer}>
            {topScorers.length > 0 ? (
              topScorers.map((player, index) => (
                <View key={player.id} style={styles.rankingItem}>
                  <View style={styles.rankingPosition}>
                    <Text style={styles.positionText}>{index + 1}º</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.teamName}>{getTeamName(player.teamId)}</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>{player.stats?.goals || 0} gols</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhum gol marcado ainda</Text>
            )}
          </View>
        </View>

        {/* Top Assistentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Top Assistentes</Text>
          <View style={styles.rankingContainer}>
            {topAssisters.length > 0 ? (
              topAssisters.map((player, index) => (
                <View key={player.id} style={styles.rankingItem}>
                  <View style={styles.rankingPosition}>
                    <Text style={styles.positionText}>{index + 1}º</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.teamName}>{getTeamName(player.teamId)}</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>{player.stats?.assists || 0} assist.</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhuma assistência registrada ainda</Text>
            )}
          </View>
        </View>

        {/* Estatísticas por Posição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estatísticas por Posição</Text>
          <View style={styles.positionStatsContainer}>
            {Object.entries(positionStats).map(([position, stats]) => (
              <View key={position} style={styles.positionCard}>
                <Text style={styles.positionName}>{position}</Text>
                <View style={styles.positionStats}>
                  <Text style={styles.positionStat}>{stats.count} jogadores</Text>
                  <Text style={styles.positionStat}>{stats.goals} gols</Text>
                  <Text style={styles.positionStat}>{stats.assists} assist.</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Eventos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Eventos Agendados</Text>
          <View style={styles.eventStatsContainer}>
            <View style={styles.eventStatCard}>
              <Ionicons name="football" size={24} color="#4CAF50" />
              <Text style={styles.eventStatValue}>{eventStats.jogo || 0}</Text>
              <Text style={styles.eventStatLabel}>Jogos</Text>
            </View>
            <View style={styles.eventStatCard}>
              <Ionicons name="fitness" size={24} color="#2196F3" />
              <Text style={styles.eventStatValue}>{eventStats.treino || 0}</Text>
              <Text style={styles.eventStatLabel}>Treinos</Text>
            </View>
            <View style={styles.eventStatCard}>
              <Ionicons name="people" size={24} color="#FF9800" />
              <Text style={styles.eventStatValue}>{eventStats.reuniao || 0}</Text>
              <Text style={styles.eventStatLabel}>Reuniões</Text>
            </View>
          </View>
        </View>

        {/* Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚽ Times Cadastrados</Text>
          <View style={styles.teamsContainer}>
            {teams.length > 0 ? (
              teams.map((team) => {
                const teamPlayers = players.filter(p => p.teamId === team.id);
                const teamGoals = teamPlayers.reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
                const teamAssists = teamPlayers.reduce((sum, p) => sum + (p.stats?.assists || 0), 0);
                
                return (
                  <View key={team.id} style={styles.teamCard}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <View style={styles.teamStats}>
                      <Text style={styles.teamStat}>{teamPlayers.length} jogadores</Text>
                      <Text style={styles.teamStat}>{teamGoals} gols</Text>
                      <Text style={styles.teamStat}>{teamAssists} assist.</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Nenhum time cadastrado ainda</Text>
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
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
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  rankingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankingPosition: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  positionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  teamName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statBadge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  positionStatsContainer: {
    gap: 10,
  },
  positionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  positionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  positionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionStat: {
    fontSize: 14,
    color: '#666',
  },
  eventStatsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  eventStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  eventStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  teamsContainer: {
    gap: 10,
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  teamStat: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
}); 