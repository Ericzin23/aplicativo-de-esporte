import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useRouter } from 'expo-router';
import { AddTeamModal } from '../../components/AddTeamModal';
import { AddPlayerModal } from '../../components/AddPlayerModal';
import { AddEventModal } from '../../components/AddEventModal';
import { SPORTS_CONFIG, getSportPositions } from '../../utils/sportsConfig';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    getStats, 
    getTodayEvents, 
    getUpcomingEvents, 
    getTeamsBySport, 
    getPlayersBySport, 
    getEventsBySport,
    teams = [],
    players = [],
    events = []
  } = useAppData();
  
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Todos');
  const [selectedTeam, setSelectedTeam] = useState('Todos');
  const [selectedPosition, setSelectedPosition] = useState('Todos');

  // Animações para feedback visual
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  // Esportes disponíveis
  const sports = ['Todos', 'Futebol', 'Vôlei', 'Basquete', 'Futsal', 'Handebol'];
  const allPositions = React.useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(SPORTS_CONFIG).flatMap((config) => config.positions)
        )
      ),
    []
  );

  // Função para obter dados filtrados por esporte
  const filteredData = React.useMemo(() => {
    if (selectedSport === 'Todos') {
      return {
        teams: teams || [],
        players: players || [],
        events: events || [],
        todayEvents: getTodayEvents() || [],
        upcomingEvents: (getUpcomingEvents() || []).slice(0, 3)
      };
    }
    
    const sportKey = selectedSport.toLowerCase();
    const filteredTeams = getTeamsBySport(sportKey) || [];
    const filteredPlayers = getPlayersBySport(sportKey) || [];
    const filteredEvents = getEventsBySport(sportKey) || [];
    const todayEvents = (getTodayEvents() || []).filter(event => event.sport === sportKey);
    const upcomingEvents = (getUpcomingEvents() || [])
      .filter(event => event.sport === sportKey)
      .slice(0, 3);

    return {
      teams: filteredTeams,
      players: filteredPlayers,
      events: filteredEvents,
      todayEvents,
      upcomingEvents
    };
  }, [selectedSport, teams, players, events, getTodayEvents, getUpcomingEvents, getTeamsBySport, getPlayersBySport, getEventsBySport]);

  const teamsForFilter = React.useMemo(
    () =>
      (filteredData.teams || []).map((t) => ({ id: t.id, name: t.name })),
    [filteredData.teams]
  );

  const positionsForFilter = React.useMemo(
    () =>
      selectedSport === 'Todos'
        ? allPositions
        : getSportPositions(selectedSport.toLowerCase()),
    [selectedSport, allPositions]
  );

  const filteredPlayers = React.useMemo(() => 
    (filteredData.players || []).filter((p) => {
      const matchesTeam = selectedTeam === 'Todos' || p.teamId === selectedTeam;
      const matchesPosition =
        selectedPosition === 'Todos' || p.position === selectedPosition;
      return matchesTeam && matchesPosition;
    }),
    [filteredData.players, selectedTeam, selectedPosition]
  );

  // Estatísticas baseadas no esporte selecionado
  const stats = React.useMemo(() => {
    const stats = getStats();
    return {
      totalTeams: stats?.totalTeams || 0,
      totalPlayers: stats?.totalPlayers || 0,
      todayGames: stats?.todayGames || 0,
      todayTrainings: stats?.todayTrainings || 0,
    };
  }, [getStats]);

  const statsData = React.useMemo(() => [
    { title: 'Times Ativos', value: stats.totalTeams.toString(), icon: 'people', color: '#4CAF50' },
    { title: 'Jogadores', value: stats.totalPlayers.toString(), icon: 'person', color: '#2196F3' },
    { title: 'Jogos Hoje', value: stats.todayGames.toString(), icon: 'football', color: '#FF9800' },
    { title: 'Treinos', value: stats.todayTrainings.toString(), icon: 'fitness', color: '#9C27B0' },
  ], [stats]);

  // Atividades recentes baseadas nos dados reais
  const getRecentActivities = () => {
    const activities = [];
    
    // Últimos jogadores adicionados
    const recentPlayers = (filteredData.players || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2);
    
    recentPlayers.forEach(player => {
      const team = (filteredData.teams || []).find(t => t.id === player.teamId);
      activities.push({
        id: `player-${player.id}`,
        title: `Adicionou ${player.name}`,
        subtitle: `ao ${team?.name || 'time indefinido'}`,
        time: getTimeAgo(player.createdAt),
        icon: 'person-add'
      });
    });

    // Últimos times criados
    const recentTeams = (filteredData.teams || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 1);
    
    recentTeams.forEach(team => {
      activities.push({
        id: `team-${team.id}`,
        title: `Criou o time ${team.name}`,
        subtitle: team.sport.charAt(0).toUpperCase() + team.sport.slice(1),
        time: getTimeAgo(team.createdAt),
        icon: 'add-circle'
      });
    });

    // Próximos eventos
    const upcomingEvents = (filteredData.upcomingEvents || []).slice(0, 1);
    upcomingEvents.forEach(event => {
      activities.push({
        id: `event-${event.id}`,
        title: `Agendou ${event.type}`,
        subtitle: `${event.title} - ${new Date(event.date).toLocaleDateString('pt-BR')} ${event.time}`,
        time: getTimeAgo(event.createdAt),
        icon: event.type === 'jogo' ? 'football' : event.type === 'treino' ? 'fitness' : 'calendar'
      });
    });

    return activities.slice(0, 4);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d atrás';
    return `${diffInDays}d atrás`;
  };

  const recentActivities = getRecentActivities();

  const handleButtonPress = (index: number, action: () => void) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(action, 150);
  };

  const quickActions = [
    {
      icon: 'add-circle',
      text: 'Novo Time',
      action: () => setShowTeamModal(true),
    },
    {
      icon: 'person-add',
      text: 'Add Jogador',
      action: () => setShowPlayerModal(true),
    },
    {
      icon: 'calendar-outline',
      text: 'Agendar',
      action: () => setShowEventModal(true),
    },
    {
      icon: 'stats-chart',
      text: 'Relatórios',
      action: () => router.push('/relatorios'),
    },
  ];

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

  const getSportColor = (sport: string) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={true}
        bouncesZoom={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bem-vindo, Eric! 👋</Text>
            <Text style={styles.subtitle}>Painel de controle esportivo</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/perfil')}
          >
            <Ionicons name="person-circle" size={40} color="#0066FF" />
          </TouchableOpacity>
        </View>

        {/* Filtro por Esporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtrar por Esporte</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sportFilterContainer}
            contentContainerStyle={styles.sportFilterContent}
            bounces={true}
          >
            {sports.map((sport) => (
              <TouchableOpacity
                key={`sport-${sport}`}
                style={[
                  styles.sportFilterButton,
                  selectedSport === sport && styles.sportFilterButtonActive
                ]}
                onPress={() => setSelectedSport(sport)}
                activeOpacity={0.7}
              >
                {sport !== 'Todos' && (
                  <Ionicons
                    name={getSportIcon(sport) as any}
                    size={16}
                    color={selectedSport === sport ? '#fff' : getSportColor(sport)}
                    style={styles.sportFilterIcon}
                  />
                )}
                <Text style={[
                  styles.sportFilterText,
                  selectedSport === sport && styles.sportFilterTextActive
                ]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Cards com scroll horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
          bounces={true}
        >
          {statsData.map((stat) => (
            <View
              key={stat.title}
              style={[styles.statCard, { borderLeftColor: stat.color }]}
            >
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  {selectedSport !== 'Todos' && (
                    <Text style={styles.statSport}>{selectedSport}</Text>
                  )}
                </View>
                <View
                  style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}
                >
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

      {/* Filtro por Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filtrar por Time</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sportFilterContainer}
          contentContainerStyle={styles.sportFilterContent}
        >
          {['Todos', ...teamsForFilter.map(t => t.name)].map(name => (
            <TouchableOpacity
              key={`team-${name}`}
              style={[
                styles.sportFilterButton,
                selectedTeam === name && styles.sportFilterButtonActive
              ]}
              onPress={() => setSelectedTeam(name === 'Todos' ? 'Todos' : teamsForFilter.find(t => t.name === name)?.id || 'Todos')}
            >
              <Text style={[
                styles.sportFilterText,
                selectedTeam === name && styles.sportFilterTextActive
              ]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filtro por Posição */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filtrar por Posição</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sportFilterContainer}
          contentContainerStyle={styles.sportFilterContent}
        >
          {['Todos', ...positionsForFilter].map(position => (
            <TouchableOpacity
              key={`position-${position}`}
              style={[
                styles.sportFilterButton,
                selectedPosition === position && styles.sportFilterButtonActive
              ]}
              onPress={() => setSelectedPosition(position)}
            >
              <Text style={[
                styles.sportFilterText,
                selectedPosition === position && styles.sportFilterTextActive
              ]}>{position}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Jogadores */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alunos</Text>
        <View style={styles.playersContainer}>
          {filteredPlayers.length > 0 ? (
            filteredPlayers.slice(0, 3).map(player => {
              const team = teams.find(t => t.id === player.teamId);
              return (
                <View key={player.id} style={styles.playerItem}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerSub}>{team?.name || 'Sem time'} - {player.position}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noPlayersText}>Nenhum jogador encontrado</Text>
          )}
        </View>
      </View>

      {/* Desempenho por Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desempenho por Time</Text>
        <View style={styles.performanceContainer}>
          {filteredData.teams.map(team => (
            <View key={team.id} style={styles.performanceItem}>
              <Text style={styles.perfTeam}>{team.name}</Text>
              <Text style={styles.perfStats}>{team.wins}V {team.draws}E {team.losses}D</Text>
            </View>
          ))}
        </View>
      </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.text}
                style={[
                  styles.actionButtonContainer,
                  { transform: [{ scale: scaleAnims[index] }] }
                ]}
              >
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleButtonPress(index, action.action)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={action.icon as any} size={24} color="#0066FF" />
                  <Text style={styles.actionText}>{action.text}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Recentes</Text>
          <View style={styles.activitiesContainer}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name={activity.icon as any} size={20} color="#0066FF" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              ))
            ) : (
              <View style={styles.noActivitiesContainer}>
                <Ionicons name="time-outline" size={40} color="#ccc" />
                <Text style={styles.noActivitiesText}>
                  {selectedSport === 'Todos' 
                    ? 'Nenhuma atividade recente' 
                    : `Nenhuma atividade de ${selectedSport}`
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eventos de Hoje</Text>
          <View style={styles.scheduleContainer}>
            {filteredData.todayEvents.length > 0 ? (
              filteredData.todayEvents.map((event) => (
                <View key={event.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.timeText}>{event.time}</Text>
                  </View>
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleTitle}>{event.title}</Text>
                    <Text style={styles.scheduleLocation}>
                      {event.location || `${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`}
                    </Text>
                    {selectedSport === 'Todos' && (
                      <View style={styles.eventSportTag}>
                        <Ionicons
                          name={getSportIcon(event.sport) as any}
                          size={12}
                          color={getSportColor(event.sport)}
                        />
                        <Text style={[styles.eventSportText, { color: getSportColor(event.sport) }]}>
                          {event.sport.charAt(0).toUpperCase() + event.sport.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={40} color="#ccc" />
                <Text style={styles.noEventsText}>
                  {selectedSport === 'Todos' 
                    ? 'Nenhum evento hoje' 
                    : `Nenhum evento de ${selectedSport} hoje`
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Upcoming Events */}
        {filteredData.upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <View style={styles.scheduleContainer}>
              {filteredData.upcomingEvents.map((event) => (
                <View key={event.id} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.timeText}>{event.time}</Text>
                    <Text style={styles.dateText}>
                      {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleTitle}>{event.title}</Text>
                    <Text style={styles.scheduleLocation}>
                      {event.location || `${event.type.charAt(0).toUpperCase() + event.type.slice(1)}`}
                    </Text>
                    {selectedSport === 'Todos' && (
                      <View style={styles.eventSportTag}>
                        <Ionicons
                          name={getSportIcon(event.sport) as any}
                          size={12}
                          color={getSportColor(event.sport)}
                        />
                        <Text style={[styles.eventSportText, { color: getSportColor(event.sport) }]}>
                          {event.sport.charAt(0).toUpperCase() + event.sport.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <AddTeamModal 
        visible={showTeamModal} 
        onClose={() => setShowTeamModal(false)} 
      />
      <AddPlayerModal 
        visible={showPlayerModal} 
        onClose={() => setShowPlayerModal(false)} 
      />
      <AddEventModal 
        visible={showEventModal} 
        onClose={() => setShowEventModal(false)} 
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileButton: {
    padding: 5,
  },
  section: {
    margin: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sportFilterContainer: {
    marginBottom: 10,
  },
  sportFilterContent: {
    gap: 8,
  },
  sportFilterButton: {
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
  sportFilterButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  sportFilterIcon: {
    marginRight: 6,
  },
  sportFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sportFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    padding: 15,
    paddingLeft: 15,
  },
  statCard: {
    width: 160,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statSport: {
    fontSize: 10,
    color: '#0066FF',
    marginTop: 2,
    fontWeight: '600',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButtonContainer: {
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
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  activitiesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  noActivitiesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  scheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scheduleItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleTime: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginRight: 15,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scheduleLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventSportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  eventSportText: {
    fontSize: 10,
    fontWeight: '600',
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noEventsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  playersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 6,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playerSub: {
    fontSize: 12,
    color: '#666',
  },
  noPlayersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 10,
  },
  performanceContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  perfTeam: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  perfStats: {
    fontSize: 12,
    color: '#666',
  },
});
