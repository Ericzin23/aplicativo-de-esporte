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
  isLoading: boolean;
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
  syncProfessorToAluno: (data: Partial<AppDataContextType>) => void;
  syncAlunoToProfessor: (data: Partial<AppDataContextType>) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { notifyEvent, notifyStats, notifyGuidance, showNotification } = useNotifications();

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
      notifyEvent(newEvent.title, newEvent.description);
      showNotification('Evento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      showNotification('Erro ao adicionar evento', 'error');
    }
  }, [events, notifyEvent, showNotification]);

  const addGuidance = useCallback(async (playerId: string, guidance: Omit<Guidance, 'id'>) => {
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
  }, [notifyGuidance, showNotification]);

  const addPlayerStats = useCallback(async (playerId: string, stats: Record<string, number>) => {
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
  }, [players, notifyStats, showNotification]);

  // As demais funções seguem...

  const value = {
    teams,
    players,
    events,
    isLoading,
    addTeam,
    addPlayer,
    addEvent,
    addGuidance,
    addPlayerStats,
    // ...e todas as outras funções que você já declarou
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
