import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getItem, setItem, StorageKeys } from '../utils/storage';

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
  sport: string;
  position: string;
  teamId: string;
  goals: number;
  assists: number;
  age: number;
  createdAt: string;
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

interface AppDataContextType {
  teams: Team[];
  players: Player[];
  events: Event[];
  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  addPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void;
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => void;
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
    goals: 0,
    assists: 2,
    age: 25,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pedro Santos',
    sport: 'futebol',
    position: 'Atacante',
    teamId: '1',
    goals: 8,
    assists: 3,
    age: 23,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Maria Oliveira',
    sport: 'volei',
    position: 'Levantador',
    teamId: '3',
    goals: 0,
    assists: 15,
    age: 22,
    createdAt: new Date().toISOString(),
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

  // Carregar dados do storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Carregando dados do storage...');
      const storedTeams = await getItem<Team[]>(StorageKeys.TEAMS);
      const storedPlayers = await getItem<Player[]>(StorageKeys.PLAYERS);
      const storedEvents = await getItem<Event[]>(StorageKeys.EVENTS);
      
      console.log('📦 Dados do storage:', { storedTeams, storedPlayers, storedEvents });
      
      // Se não há dados salvos, usar dados iniciais
      if (!storedTeams || storedTeams.length === 0) {
        console.log('🆕 Usando dados iniciais para teams');
        setTeams(initialTeams);
        await setItem(StorageKeys.TEAMS, initialTeams);
      } else {
        console.log('✅ Carregando teams do storage:', storedTeams.length, 'times');
        // Migrar dados antigos sem esporte
        const migratedTeams = storedTeams.map(team => ({
          ...team,
          sport: team.sport || 'futebol'
        }));
        setTeams(migratedTeams);
        if (migratedTeams.some(team => !team.sport)) {
          await setItem(StorageKeys.TEAMS, migratedTeams);
        }
      }

      if (!storedPlayers || storedPlayers.length === 0) {
        console.log('🆕 Usando dados iniciais para players');
        setPlayers(initialPlayers);
        await setItem(StorageKeys.PLAYERS, initialPlayers);
      } else {
        console.log('✅ Carregando players do storage:', storedPlayers.length, 'jogadores');
        // Migrar dados antigos sem esporte
        const migratedPlayers = storedPlayers.map(player => ({
          ...player,
          sport: player.sport || 'futebol'
        }));
        setPlayers(migratedPlayers);
        if (migratedPlayers.some(player => !player.sport)) {
          await setItem(StorageKeys.PLAYERS, migratedPlayers);
        }
      }

      if (!storedEvents || storedEvents.length === 0) {
        console.log('🆕 Usando dados iniciais para events');
        setEvents(initialEvents);
        await setItem(StorageKeys.EVENTS, initialEvents);
      } else {
        console.log('✅ Carregando events do storage:', storedEvents.length, 'eventos');
        // Migrar dados antigos sem esporte
        const migratedEvents = storedEvents.map(event => ({
          ...event,
          sport: event.sport || 'futebol'
        }));
        setEvents(migratedEvents);
        if (migratedEvents.some(event => !event.sport)) {
          await setItem(StorageKeys.EVENTS, migratedEvents);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      // Em caso de erro, usar dados iniciais
      setTeams(initialTeams);
      setPlayers(initialPlayers);
      setEvents(initialEvents);
    }
  };

  const saveTeams = async (newTeams: Team[]) => {
    try {
      await setItem(StorageKeys.TEAMS, newTeams);
      setTeams(newTeams);
    } catch (error) {
      console.error('Erro ao salvar times:', error);
    }
  };

  const savePlayers = async (newPlayers: Player[]) => {
    try {
      await setItem(StorageKeys.PLAYERS, newPlayers);
      setPlayers(newPlayers);
    } catch (error) {
      console.error('Erro ao salvar jogadores:', error);
    }
  };

  const saveEvents = async (newEvents: Event[]) => {
    try {
      await setItem(StorageKeys.EVENTS, newEvents);
      setEvents(newEvents);
    } catch (error) {
      console.error('Erro ao salvar eventos:', error);
    }
  };

  const addTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>) => {
    const newTeam: Team = {
      ...teamData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newTeams = [...teams, newTeam];
    await saveTeams(newTeams);
  };

  const addPlayer = async (playerData: Omit<Player, 'id' | 'createdAt'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newPlayers = [...players, newPlayer];
    await savePlayers(newPlayers);
  };

  const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newEvents = [...events, newEvent];
    await saveEvents(newEvents);
  };

  const updateTeam = async (id: string, teamData: Partial<Team>) => {
    const newTeams = teams.map(team => 
      team.id === id ? { ...team, ...teamData } : team
    );
    await saveTeams(newTeams);
  };

  const updatePlayer = async (id: string, playerData: Partial<Player>) => {
    const newPlayers = players.map(player => 
      player.id === id ? { ...player, ...playerData } : player
    );
    await savePlayers(newPlayers);
  };

  const deleteTeam = async (id: string) => {
    const newTeams = teams.filter(team => team.id !== id);
    await saveTeams(newTeams);
  };

  const deletePlayer = async (id: string) => {
    const newPlayers = players.filter(player => player.id !== id);
    await savePlayers(newPlayers);
  };

  const getPlayersByTeam = (teamId: string) => {
    return players.filter(player => player.teamId === teamId);
  };

  const getPlayersByPosition = (position: string) => {
    return players.filter(player => player.position === position);
  };

  const getPlayersBySport = (sport: string) => {
    return players.filter(player => player.sport === sport);
  };

  const getTeamsBySport = (sport: string) => {
    return teams.filter(team => team.sport === sport);
  };

  const getEventsBySport = (sport: string) => {
    return events.filter(event => event.sport === sport);
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getStats = () => {
    const todayEvents = getTodayEvents();
    return {
      totalTeams: teams.length,
      totalPlayers: players.length,
      todayGames: todayEvents.filter(e => e.type === 'jogo').length,
      todayTrainings: todayEvents.filter(e => e.type === 'treino').length,
    };
  };

  // INÍCIO - FUNÇÕES DE SINCRONIZAÇÃO
  const syncProfessorToAluno = async (
    data: Partial<AppDataContextType>
  ) => {
    try {
      console.log('🔄 Sincronizando dados do professor -> aluno');
      if (data.teams) setTeams(data.teams);
      if (data.players) setPlayers(data.players);
      if (data.events) setEvents(data.events);
    } catch (error) {
      console.error('Erro ao sincronizar professor -> aluno:', error);
    }
  };

  const syncAlunoToProfessor = async (
    data: Partial<AppDataContextType>
  ) => {
    try {
      console.log('🔄 Sincronizando dados do aluno -> professor');
      // Aqui você poderia enviar os dados para o backend
      // await apiService.syncAluno(data);
    } catch (error) {
      console.error('Erro ao sincronizar aluno -> professor:', error);
    }
  };
  // FIM - FUNÇÕES DE SINCRONIZAÇÃO

  return (
    <AppDataContext.Provider value={{
      teams,
      players,
      events,
      addTeam,
      addPlayer,
      addEvent,
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
    }}>
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