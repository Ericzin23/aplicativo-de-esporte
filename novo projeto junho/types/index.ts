// Tipos de usuário
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de time
export interface Team {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user: User;
}

// Tipos de jogador
export interface Player {
  id: string;
  name: string;
  position: string;
  number?: number;
  photo?: string;
  teamId: string;
  stats: PlayerStats;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

// Tipos de partida
export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: string;
  location?: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  homeTeam: Team;
  awayTeam: Team;
}

// Tipos de evento
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'match' | 'training' | 'meeting' | 'other';
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de navegação
export type RootStackParamList = {
  index: undefined;
  login: undefined;
  cadastro: undefined;
  esqueceuSenha: undefined;
  cadastroProfissional: undefined;
  perfilEsporte: undefined;
  editarPerfil: undefined;
  perfil: undefined;
  '(tabs)': undefined;
};

export type TabParamList = {
  index: undefined;
  times: undefined;
  jogadores: undefined;
  calendario: undefined;
  configuracoes: undefined;
};

// Tipos de formulário
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileForm {
  name: string;
  email: string;
  telefone?: string;
  altura?: string;
  peso?: string;
  lateralidade?: string;
  esporte?: string;
  posicao?: string;
  descricao?: string;
}

// Tipos de dados profissionais
export interface ProfessionalData {
  esporte: string;
  posicao: string;
  anosExperiencia: string;
  horarios: Record<string, boolean>;
  participouCampeonatos: boolean;
}

// Tipos de configuração
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language: string;
}

// Tipos de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} 