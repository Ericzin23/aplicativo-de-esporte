import { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = 'https://api.gestao-times.com'; // Substitua pela URL real da sua API

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Erro na requisição',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  // Métodos de autenticação
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // Métodos de usuário
  async getProfile() {
    return this.request<any>('/user/profile');
  }

  async updateProfile(profileData: any) {
    return this.request<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Métodos de times
  async getTeams(page: number = 1, limit: number = 10) {
    return this.request<PaginatedResponse<any>>(`/teams?page=${page}&limit=${limit}`);
  }

  async getTeam(id: string) {
    return this.request<any>(`/teams/${id}`);
  }

  async createTeam(teamData: any) {
    return this.request<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  async updateTeam(id: string, teamData: any) {
    return this.request<any>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  }

  async deleteTeam(id: string) {
    return this.request(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos de jogadores
  async getPlayers(teamId?: string, page: number = 1, limit: number = 10) {
    const query = teamId ? `?teamId=${teamId}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;
    return this.request<PaginatedResponse<any>>(`/players${query}`);
  }

  async getPlayer(id: string) {
    return this.request<any>(`/players/${id}`);
  }

  async createPlayer(playerData: any) {
    return this.request<any>('/players', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  }

  async updatePlayer(id: string, playerData: any) {
    return this.request<any>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/players/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos de partidas
  async getMatches(teamId?: string, page: number = 1, limit: number = 10) {
    const query = teamId ? `?teamId=${teamId}&page=${page}&limit=${limit}` : `?page=${page}&limit=${limit}`;
    return this.request<PaginatedResponse<any>>(`/matches${query}`);
  }

  async getMatch(id: string) {
    return this.request<any>(`/matches/${id}`);
  }

  async createMatch(matchData: any) {
    return this.request<any>('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatch(id: string, matchData: any) {
    return this.request<any>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(matchData),
    });
  }

  async deleteMatch(id: string) {
    return this.request(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos de eventos
  async getEvents(page: number = 1, limit: number = 10) {
    return this.request<PaginatedResponse<any>>(`/events?page=${page}&limit=${limit}`);
  }

  async createEvent(eventData: any) {
    return this.request<any>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: string, eventData: any) {
    return this.request<any>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService(); 