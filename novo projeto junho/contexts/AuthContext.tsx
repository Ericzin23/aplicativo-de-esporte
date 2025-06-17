import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  userType: 'professor' | 'atleta';
  professorId?: string;
  sport?: string;
  position?: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    userType: 'professor' | 'atleta',
    professorId?: string,
    sport?: string,
    position?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  updatePassword: (current: string, newPassword: string) => Promise<void>;
  clearCorruptedData: () => Promise<void>;
  validateAndFixData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      await validateAndFixData();
      await loadStoredUser();
    };
    initializeAuth();
  }, []);

  async function loadStoredUser() {
    try {
      console.log('🔍 Carregando usuário armazenado...');
      const storedUser = await AsyncStorage.getItem('@GestaoTimes:user');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ Usuário encontrado:', {
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          userType: parsedUser.userType
        });
        setUser(parsedUser);
      } else {
        console.log('❌ Nenhum usuário armazenado encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Função para limpar dados corrompidos
  async function clearCorruptedData() {
    try {
      console.log('Limpando dados corrompidos...');
      await AsyncStorage.removeItem('@GestaoTimes:users');
      await AsyncStorage.removeItem('@GestaoTimes:user');
      console.log('Dados limpos com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }

  // Função para verificar e corrigir dados
  async function validateAndFixData() {
    try {
      const users = await AsyncStorage.getItem('@GestaoTimes:users');
      if (users) {
        const parsedUsers = JSON.parse(users);
        
        // Remover duplicatas por email
        const uniqueUsers = parsedUsers.filter((user: User, index: number, self: User[]) => 
          index === self.findIndex(u => u.email.toLowerCase().trim() === user.email.toLowerCase().trim())
        );
        
        if (uniqueUsers.length !== parsedUsers.length) {
          console.log('Removendo usuários duplicados...');
          await AsyncStorage.setItem('@GestaoTimes:users', JSON.stringify(uniqueUsers));
        }
      }
    } catch (error) {
      console.error('Erro ao validar dados:', error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      const storedUsers = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      const foundUser = users.find((u: User) => u.email === email);

      if (foundUser && foundUser.password === password) {
        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(foundUser));
        setUser(foundUser);
      } else if (email === 'admin@teste.com' && password === '123456') {
        const userData: User = {
          id: '1',
          name: 'Eric',
          email: email,
          password: '123456',
          avatar: 'https://via.placeholder.com/150',
          userType: 'professor'
        };

        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(
    name: string,
    email: string,
    password: string,
    userType: 'professor' | 'atleta',
    professorId?: string,
    sport?: string,
    position?: string
  ) {
    try {
      setIsLoading(true);
      
      // Normalizar email (lowercase e trim)
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log('Tentando cadastrar usuário:', { name, email: normalizedEmail, userType });
      
      const users = await AsyncStorage.getItem('@GestaoTimes:users');
      const parsedUsers = users ? JSON.parse(users) : [];
      
      console.log('Usuários existentes:', parsedUsers.length);
      
      // Verificar se email já existe (case insensitive)
      const userExists = parsedUsers.find((user: User) => 
        user.email.toLowerCase().trim() === normalizedEmail
      );

      if (userExists) {
        console.log('Email já existe:', normalizedEmail);
        throw new Error('Este e-mail já está em uso!');
      }

      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        userType,
        ...(userType === 'atleta' && professorId && { professorId }),
        ...(userType === 'atleta' && sport && { sport }),
        ...(userType === 'atleta' && position && { position }),
      };

      console.log('Criando novo usuário:', { id: newUser.id, name: newUser.name, email: newUser.email });

      const updatedUsers = [...parsedUsers, newUser];
      await AsyncStorage.setItem('@GestaoTimes:users', JSON.stringify(updatedUsers));
      await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(newUser));
      
      // Se for atleta, criar automaticamente um jogador
      if (userType === 'atleta' && sport && position) {
        await createPlayerForAthlete(newUser);
      }
      
      console.log('Usuário cadastrado com sucesso!');
      setUser(newUser);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Função para criar jogador automaticamente para atletas
  async function createPlayerForAthlete(user: User) {
    try {
      console.log('🏃‍♂️ Criando jogador para atleta:', {
        name: user.name,
        sport: user.sport,
        position: user.position,
        userType: user.userType
      });
      
      if (!user.sport || !user.position) {
        console.log('❌ Dados insuficientes para criar jogador:', { sport: user.sport, position: user.position });
        return;
      }
      
      // Aguardar um pouco para garantir que o usuário foi salvo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const players = await AsyncStorage.getItem('@GestaoTimes:players');
      const parsedPlayers = players ? JSON.parse(players) : [];
      
      console.log('📊 Jogadores existentes antes da criação:', parsedPlayers.length);
      
      // Verificar se já existe um jogador com o mesmo nome e esporte
      const existingPlayer = parsedPlayers.find((p: any) => 
        p.name.toLowerCase() === user.name.toLowerCase() && 
        p.sport === user.sport
      );
      
      if (existingPlayer) {
        console.log('⚠️ Jogador já existe:', existingPlayer.name);
        return;
      }
      
      const newPlayer = {
        id: `player-${uuid()}`,
        name: user.name,
        sport: user.sport,
        position: user.position,
        teamId: '', // Sem time inicialmente
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          goals: 0,
          assists: 0,
          games: 0,
          cards: 0,
        },
        profile: {
          age: 18, // Idade padrão
          height: undefined,
          weight: undefined,
          photo: undefined,
        },
        feedbacks: [], // Array para feedbacks
      };
      
      const updatedPlayers = [...parsedPlayers, newPlayer];
      
      // Salvar com múltiplas tentativas para garantir persistência
      let saveSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
          
          // Verificar se foi salvo corretamente
          const savedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
          const parsedSavedPlayers = savedPlayers ? JSON.parse(savedPlayers) : [];
          
          if (parsedSavedPlayers.length === updatedPlayers.length) {
            saveSuccess = true;
            console.log(`✅ Jogador salvo com sucesso na tentativa ${attempt}:`, {
              id: newPlayer.id,
              name: newPlayer.name,
              sport: newPlayer.sport,
              position: newPlayer.position,
              totalPlayers: parsedSavedPlayers.length
            });
            break;
          } else {
            console.log(`⚠️ Tentativa ${attempt} falhou - dados não persistiram corretamente`);
          }
        } catch (error) {
          console.error(`❌ Erro na tentativa ${attempt}:`, error);
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (!saveSuccess) {
        console.error('❌ Falha ao salvar jogador após 3 tentativas');
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar jogador para atleta:', error);
    }
  }

  async function signOut() {
    try {
      await AsyncStorage.removeItem('@GestaoTimes:user');
      setUser(null);
    } catch (error) {
      console.log('Erro ao fazer logout:', error);
    }
  }

  async function updateProfile(userData: Partial<User>) {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData };
        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(updatedUser));

        const storedUsers = await AsyncStorage.getItem('@GestaoTimes:users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        const userIndex = users.findIndex((u: User) => u.id === user.id);

        if (userIndex !== -1) {
          users[userIndex] = updatedUser;
          await AsyncStorage.setItem('@GestaoTimes:users', JSON.stringify(users));
        }

        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }

  async function updatePassword(current: string, newPassword: string) {
    if (!user) return;

    const storedUsers = await AsyncStorage.getItem('@GestaoTimes:users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const userIndex = users.findIndex((u: User) => u.id === user.id);

    if (userIndex === -1 || users[userIndex].password !== current) {
      throw new Error('Senha atual incorreta');
    }

    users[userIndex].password = newPassword;
    await AsyncStorage.setItem('@GestaoTimes:users', JSON.stringify(users));

    const updated = { ...user, password: newPassword };
    await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(updated));
    setUser(updated);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePassword,
        clearCorruptedData,
        validateAndFixData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
