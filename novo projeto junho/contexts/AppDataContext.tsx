import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getItem, setItem, StorageKeys } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { View, ActivityIndicator, Alert } from 'react-native';

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
  syncProfessorToAluno: (data: Partial<AppDataContextType>) => void;
  syncAlunoToProfessor: (data: Partial<AppDataContextType>) => void;
  reloadData: () => Promise<void>;
  debugStorage: () => Promise<void>;
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

// Função auxiliar para criar um novo jogador com valores padrão
export function createNewPlayer(data: Partial<Player>): Player {
  return {
    id: data.id || '',
    name: data.name || '',
    position: data.position || '',
    sport: data.sport || '',
    teamId: data.teamId || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    stats: {
      goals: data.stats?.goals || 0,
      assists: data.stats?.assists || 0,
      games: data.stats?.games || 0,
      cards: data.stats?.cards || 0,
    },
    profile: {
      age: data.profile?.age || 0,
      height: data.profile?.height,
      weight: data.profile?.weight,
      photo: data.profile?.photo,
    },
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState(0);

  // Função de debug para verificar dados no AsyncStorage
  const debugStorage = async () => {
    try {
      console.log('🔍 === DEBUG STORAGE ===');
      
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 Todas as chaves no AsyncStorage:', allKeys);
      
      const teamsData = await AsyncStorage.getItem('@GestaoTimes:teams');
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const eventsData = await AsyncStorage.getItem('@GestaoTimes:events');
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      const currentUser = await AsyncStorage.getItem('@GestaoTimes:user');
      
      console.log('🏆 Teams raw data:', teamsData);
      console.log('👥 Players raw data:', playersData);
      console.log('📅 Events raw data:', eventsData);
      console.log('👤 Users raw data:', usersData);
      console.log('🔐 Current user:', currentUser);
      
      if (teamsData) {
        const teams = JSON.parse(teamsData);
        console.log('🏆 Teams parsed:', teams.length, teams);
      }
      
      if (playersData) {
        const players = JSON.parse(playersData);
        console.log('👥 Players parsed:', players.length, players);
      }
      
      console.log('🔍 === FIM DEBUG ===');
    } catch (error) {
      console.error('❌ Erro no debug:', error);
    }
  };

  // Carregar dados do AsyncStorage com controle de frequência
  const loadData = async (force = false) => {
    try {
      const now = Date.now();
      
      // Evitar recarregamentos muito frequentes (menos de 1 segundo)
      if (!force && now - lastLoadTime < 1000) {
        console.log('⏭️ Pulando recarregamento (muito recente)');
        return;
      }
      
      console.log('📊 Carregando dados do AppDataContext...');
      setLastLoadTime(now);
      
      const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const storedEvents = await AsyncStorage.getItem('@GestaoTimes:events');

      const teamsData = storedTeams ? JSON.parse(storedTeams) : [];
      const playersData = storedPlayers ? JSON.parse(storedPlayers) : [];
      const eventsData = storedEvents ? JSON.parse(storedEvents) : [];

      console.log('📊 Dados carregados do storage:', {
        teams: teamsData.length,
        players: playersData.length,
        events: eventsData.length
      });

      console.log('📊 Estado atual antes da atualização:', {
        teams: teams.length,
        players: players.length,
        events: events.length
      });

      // Só atualizar se os dados realmente mudaram
      if (JSON.stringify(teamsData) !== JSON.stringify(teams)) {
        console.log('🔄 Atualizando teams');
        setTeams(teamsData);
      }
      
      if (JSON.stringify(playersData) !== JSON.stringify(players)) {
        console.log('🔄 Atualizando players');
        setPlayers(playersData);
      }
      
      if (JSON.stringify(eventsData) !== JSON.stringify(events)) {
        console.log('🔄 Atualizando events');
        setEvents(eventsData);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData(true);
  }, []);

  // Função para recarregar dados com controle
  const reloadData = useCallback(async (force = false) => {
    console.log('🔄 Recarregando dados...', force ? '(forçado)' : '');
    await loadData(force);
  }, [lastLoadTime]);

  // Funções de adição com melhor persistência
  const addTeam = async (team: Omit<Team, 'id' | 'createdAt'>) => {
    try {
      console.log('🏆 Tentando adicionar time:', team);
      
      // Verifica se já existe um time com o mesmo nome
      const teamExists = teams.some(t => t.name.toLowerCase() === team.name.toLowerCase());
      if (teamExists) {
        throw new Error('Já existe um time com este nome.');
      }

      const newTeam: Team = {
        ...team,
        id: `team-${uuid()}`,
        createdAt: new Date().toISOString(),
      };

      console.log('🏆 Novo time criado:', newTeam);

      // Atualiza o estado local primeiro
      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      
      // Verifica se foi salvo corretamente
      const savedData = await AsyncStorage.getItem('@GestaoTimes:teams');
      console.log('✅ Time salvo no AsyncStorage:', savedData ? JSON.parse(savedData).length : 0, 'times');

    } catch (error) {
      console.error('❌ Erro ao criar time:', error);
      // Reverte o estado em caso de erro
      setTeams(teams);
      throw error;
    }
  };

  const addPlayer = useCallback(async (player: Omit<Player, 'id'>) => {
    try {
      console.log('👥 Tentando adicionar jogador:', player.name);
      
      const newPlayer: Player = {
        ...player,
        id: `player-${uuid()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          goals: 0,
          assists: 0,
          games: 0,
          cards: 0,
        },
        profile: {
          age: player.profile?.age || 18,
        },
      };

      // Atualizar estado local primeiro
      const updatedPlayers = [...players, newPlayer];
      setPlayers(updatedPlayers);
      
      console.log('👥 Estado local atualizado, salvando no AsyncStorage...');

      // Salvar no AsyncStorage
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      
      // Verificar se foi salvo
      const savedData = await AsyncStorage.getItem('@GestaoTimes:players');
      const savedPlayers = savedData ? JSON.parse(savedData) : [];
      
      console.log('✅ Jogador salvo:', {
        nome: newPlayer.name,
        totalNoStorage: savedPlayers.length,
        totalNoEstado: updatedPlayers.length
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar jogador:', error);
      // Reverter estado em caso de erro
      await reloadData(true);
    }
  }, [players]);

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
      console.log('Evento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
    }
  }, [events]);

  const addGuidance = useCallback(async (playerId: string, guidance: Omit<Guidance, 'id'>) => {
    try {
      console.log('Adicionando orientação para jogador:', playerId);
      // Implementação futura para orientações
    } catch (error) {
      console.error('Erro ao adicionar orientação:', error);
    }
  }, []);

  const addPlayerStats = useCallback(async (playerId: string, stats: Record<string, number>) => {
    try {
      const updatedPlayers = players.map(p => 
        p.id === playerId 
          ? { ...p, stats: { ...p.stats, ...stats }, updatedAt: new Date().toISOString() }
          : p
      );
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      console.log('Estatísticas do jogador atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }, [players]);

  const syncProfessorToAluno = useCallback((data: Partial<AppDataContextType>) => {
    try {
      if (data.teams) setTeams(data.teams);
      if (data.players) setPlayers(data.players);
      if (data.events) setEvents(data.events);
      console.log('Dados sincronizados do professor para aluno');
    } catch (error) {
      console.error('Erro na sincronização professor->aluno:', error);
    }
  }, []);

  const syncAlunoToProfessor = useCallback((data: Partial<AppDataContextType>) => {
    try {
      console.log('Sincronizando dados do aluno para professor');
      // Implementação futura para sincronização
    } catch (error) {
      console.error('Erro na sincronização aluno->professor:', error);
    }
  }, []);

  // Funções de atualização
  const updateTeam = useCallback(async (id: string, team: Partial<Team>) => {
    try {
      const updatedTeams = teams.map(t => t.id === id ? { ...t, ...team } : t);
      setTeams(updatedTeams);
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      console.log('Time atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar time:', error);
    }
  }, [teams]);

  const updatePlayer = useCallback(async (id: string, player: Partial<Player>) => {
    try {
      const updatedPlayers = players.map(p => p.id === id ? { ...p, ...player, updatedAt: new Date().toISOString() } : p);
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      console.log('Jogador atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar jogador:', error);
    }
  }, [players]);

  // Funções de remoção
  const deleteTeam = useCallback(async (id: string) => {
    try {
      const updatedTeams = teams.filter(t => t.id !== id);
      setTeams(updatedTeams);
      await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify(updatedTeams));
      console.log('Time removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover time:', error);
    }
  }, [teams]);

  const deletePlayer = useCallback(async (id: string) => {
    try {
      const updatedPlayers = players.filter(p => p.id !== id);
      setPlayers(updatedPlayers);
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      console.log('Jogador removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover jogador:', error);
    }
  }, [players]);

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
    getStats,
    syncProfessorToAluno,
    syncAlunoToProfessor,
    reloadData,
    debugStorage,
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