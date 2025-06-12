import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  userType: 'professor' | 'atleta';
  professorId?: string; // Para atletas, referência ao professor
  sport?: string; // Para atletas, esporte que pratica
  position?: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, userType: 'professor' | 'atleta', professorId?: string, sport?: string, position?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem('@GestaoTimes:user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Erro ao carregar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      
      // Verificar se é um usuário cadastrado
      const storedUsers = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const foundUser = users.find((u: User) => u.email === email);
      
      if (foundUser && password === '123456') { // Senha padrão para demo
        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(foundUser));
        setUser(foundUser);
      } else if (email === 'admin@teste.com' && password === '123456') {
        // Usuário admin padrão (professor)
        const userData: User = {
          id: '1',
          name: 'Eric',
          email: email,
          avatar: 'https://via.placeholder.com/150',
          userType: 'professor'
        };
        
        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error('Email ou senha incorretos');
      }
    } catch (error) {
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
      const users = await AsyncStorage.getItem('@GestaoTimes:users');
      const parsedUsers = users ? JSON.parse(users) : [];

      const userExists = parsedUsers.find((user: User) => user.email === email);

      if (userExists) {
        throw new Error('Usuário já existe');
      }

      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        userType,
        ...(userType === 'atleta' && professorId && { professorId }),
        ...(userType === 'atleta' && sport && { sport }),
        ...(userType === 'atleta' && position && { position }),
      };

      await AsyncStorage.setItem(
        '@GestaoTimes:users',
        JSON.stringify([...parsedUsers, newUser])
      );

      setUser(newUser);
    } catch (error) {
      throw error;
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
        
        // Atualizar usuário atual
        await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(updatedUser));
        
        // Atualizar na lista de usuários
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
      throw error;
    }
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