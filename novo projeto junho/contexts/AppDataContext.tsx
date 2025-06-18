import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNotifications } from './NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { View, ActivityIndicator } from 'react-native';

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
  position: string;
  sport: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    goals: number;
    assists: number;
    games: number;
    cards: number;
  };
  profile: {
    age: number;
    height?: string;
    weight?: string;
    photo?: string;
  };
}

interface Event {
  id: string;
  title: string;
  type: 'jogo' | 'treino' | 'reuniao';
  sport: string;
  date: string;
  time: string;
  description: string;
  location?: string;
  createdAt: string;
}

interface Guidance {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data: string;
}

interface AppDataContextType {
  teams: Team[];
  players: Player[];
  events: Event[];
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => Promise<void>;
  addPlayer: (player: Omit<Player, 'id'>) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => Promise<void>;
  addGuidance: (playerId: string, guidance: Omit<Guidance, 'id'>) => Promise<void>;
  addPlayerStats: (playerId: string, stats: Record<string, number>) => Promise<void>;
  updateTeam: (id: string, team: Partial<Team>) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deleteTeam: (id: string) => void;
  deletePlayer: (id: string) => void;
  getPlayersByTeam: (teamId: string) => Player[];
  getPlayersByPosition: (position: string) => Player[];
  getPlayersBySport: (sport: string) => Player[];
  getTeamsBySport: (sport: string) => Team[];
  getEventsBySport: (sport: string) => Event[];
  getTodayEvents: () => Event[];
  getUpcomingEvents: () => Event[];
  getStats: () => {
    totalTeams: number;
    totalPlayers: number;
    todayGames: number;
    todayTrainings: number;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Dados de exemplo iniciais
const initialTeams: Team[] = [
  {
    id: '1',
    name: 'Time A',
    sport: 'futebol',
    players: 11,
    wins: 5,
    losses: 2,
    draws: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Time B',
    sport: 'futebol',
    players: 10,
    wins: 3,
    losses: 3,
    draws: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Vôlei Masters',
    sport: 'volei',
    players: 6,
    wins: 8,
    losses: 1,
    draws: 0,
    createdAt: new Date().toISOString(),
  },
];

const initialPlayers: Player[] = [
  {
    id: '1',
    name: 'João Silva',
    sport: 'futebol',
    position: 'Goleiro',
    teamId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      goals: 0,
      assists: 2,
      games: 0,
      cards: 0,
    },
    profile: {
      age: 25,
    },
  },
  {
    id: '2',
    name: 'Pedro Santos',
    sport: 'futebol',
    position: 'Atacante',
    teamId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      goals: 8,
      assists: 3,
      games: 0,
      cards: 0,
    },
    profile: {
      age: 23,
    },
  },
  {
    id: '3',
    name: 'Maria Oliveira',
    sport: 'volei',
    position: 'Levantador',
    teamId: '3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      goals: 0,
      assists: 15,
      games: 0,
      cards: 0,
    },
    profile: {
      age: 22,
    },
  },
];

const initialEvents: Event[] = [
  {
    id: '1',
    title: 'Treino Físico',
    type: 'treino',
    sport: 'futebol',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    description: 'Treino focado em condicionamento físico',
    location: 'Campo Principal',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Jogo contra Time B',
    type: 'jogo',
    sport: 'futebol',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
    time: '15:00',
    description: 'Partida amistosa contra o Time B',
    location: 'Estádio Municipal',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Treino de Vôlei',
    type: 'treino',
    sport: 'volei',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Depois de amanhã
    time: '19:30',
    description: 'Treino de fundamentos e táticas',
    location: 'Quadra Coberta',
    createdAt: new Date().toISOString(),
  },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notifyEvent, notifyStats, notifyGuidance, showNotification } = useNotifications();

  // Carregar dados do AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
        const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
        const storedEvents = await AsyncStorage.getItem('@GestaoTimes:events');

        if (storedTeams) setTeams(JSON.parse(storedTeams));
        if (storedPlayers) setPlayers(JSON.parse(storedPlayers));
        if (storedEvents) setEvents(JSON.parse(storedEvents));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setTeams([]);
        setPlayers([]);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Funções de adição
  const addTeam = useCallback(async (team: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      const newTeam: Team = {
        ...team,
        id: uuid(),
        createdAt: new Date().toISOString(),
      };

      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      showNotification('Time adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar time:', error);
      showNotification('Erro ao adicionar time', 'error');
    }
  }, [teams, showNotification]);

  const addPlayer = useCallback(async (player: Omit<Player, 'id'>) => {
    try {
      const newPlayer: Player = {
        ...player,
        id: uuid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          goals: 0,
          assists: 0,
          games: 0,
          cards: 0,
        },
        profile: {
          age: player.profile?.age || 0,
        },
      };

      const updatedPlayers = [...players, newPlayer];
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      showNotification('Jogador adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar jogador:', error);
      showNotification('Erro ao adicionar jogador', 'error');
    }
  }, [players, showNotification]);

  const addEvent = useCallback(async (event: Omit<Event, 'id' | 'createdAt'>) => {
    try {
      const newEvent: Event = {
        ...event,
        id: uuid(),
        createdAt: new Date().toISOString(),
      };

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      await AsyncStorage.setItem('@GestaoTimes:events', JSON.stringify(updatedEvents));
      notifyEvent(newEvent);
      showNotification('Evento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      showNotification('Erro ao adicionar evento', 'error');
    }
  }, [events, notifyEvent, showNotification]);

  const addGuidance = useCallback(
    async (playerId: string, guidance: Omit<Guidance, 'id'>) => {
      try {
        const newGuidance: Guidance = { ...guidance, id: uuid() };
        const key = `@GestaoTimes:orientacoes_${playerId}`;
        const stored = await AsyncStorage.getItem(key);
        const list: Guidance[] = stored ? JSON.parse(stored) : [];
        const updated = [...list, newGuidance];
        await AsyncStorage.setItem(key, JSON.stringify(updated));
        notifyGuidance(newGuidance.titulo, newGuidance.descricao);
        showNotification('Orientação enviada com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar orientação:', error);
        showNotification('Erro ao salvar orientação', 'error');
      }
    },
    [notifyGuidance, showNotification]
  );

  const addPlayerStats = useCallback(
    async (playerId: string, stats: Record<string, number>) => {
      try {
        const index = players.findIndex(p => p.id === playerId);
        if (index === -1) throw new Error('Jogador não encontrado');
        const updatedPlayer = {
          ...players[index],
          stats: { ...players[index].stats, ...stats },
          updatedAt: new Date().toISOString(),
        };
        const updated = [...players];
        updated[index] = updatedPlayer;
        setPlayers(updated);
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updated));
        notifyStats('Estatísticas atualizadas', updatedPlayer.name);
        showNotification('Estatísticas atualizadas com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
        showNotification('Erro ao atualizar estatísticas', 'error');
      }
    },
    [players, notifyStats, showNotification]
  );

  // Funções de atualização
  const updateTeam = useCallback(async (id: string, team: Partial<Team>) => {
    try {
      const updatedTeams = teams.map(t => t.id === id ? { ...t, ...team } : t);
      setTeams(updatedTeams);
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      showNotification('Time atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar time:', error);
      showNotification('Erro ao atualizar time', 'error');
    }
  }, [teams, showNotification]);

  const updatePlayer = useCallback(async (id: string, player: Partial<Player>) => {
    try {
      const updatedPlayers = players.map(p => p.id === id ? { ...p, ...player, updatedAt: new Date().toISOString() } : p);
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      showNotification('Jogador atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar jogador:', error);
      showNotification('Erro ao atualizar jogador', 'error');
    }
  }, [players, showNotification]);

  // Funções de remoção
  const deleteTeam = useCallback(async (id: string) => {
    try {
      const updatedTeams = teams.filter(t => t.id !== id);
      setTeams(updatedTeams);
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      showNotification('Time removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover time:', error);
      showNotification('Erro ao remover time', 'error');
    }
  }, [teams, showNotification]);

  const deletePlayer = useCallback(async (id: string) => {
    try {
      const updatedPlayers = players.filter(p => p.id !== id);
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      showNotification('Jogador removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover jogador:', error);
      showNotification('Erro ao remover jogador', 'error');
    }
  }, [players, showNotification]);

  // Funções de utilidade
  const getPlayersByTeam = useCallback((teamId: string) => {
    return players.filter(player => player.teamId === teamId);
  }, [players]);

  const getPlayersByPosition = useCallback((position: string) => {
    return players.filter(player => player.position === position);
  }, [players]);

  const getPlayersBySport = useCallback((sport: string) => {
    return players.filter(player => player.sport === sport);
  }, [players]);

  const getTeamsBySport = useCallback((sport: string) => {
    return teams.filter(team => team.sport === sport);
  }, [teams]);

  const getEventsBySport = useCallback((sport: string) => {
    return events.filter(event => event.sport === sport);
  }, [events]);

  const getTodayEvents = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  }, [events]);

  const getUpcomingEvents = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date > today);
  }, [events]);

  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(event => event.date === today);
    
    return {
      totalTeams: teams.length,
      totalPlayers: players.length,
      todayGames: todayEvents.filter(event => event.type === 'jogo').length,
      todayTrainings: todayEvents.filter(event => event.type === 'treino').length
    };
  }, [teams, players, events]);

  const value = {
    teams,
    players,
    events,
    addTeam,
    addPlayer,
    addEvent,
    addGuidance,
    addPlayerStats,
    updateTeam,
    updatePlayer,
    deleteTeam,
    deletePlayer,
    getPlayersByTeam,
    getPlayersByPosition,
    getPlayersBySport,
    getTeamsBySport,
    getEventsBySport,
    getTodayEvents,
    getUpcomingEvents,
    getStats
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
} 