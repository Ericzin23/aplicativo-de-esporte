import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Calendar } from 'react-native-calendars';

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
      const users = await AsyncStorage.getItem('@GestaoTimes:users');
      const parsedUsers = users ? JSON.parse(users) : [];

      const userExists = parsedUsers.find((user: User) => user.email === email);

      if (userExists) {
        throw new Error('Este e-mail já está em uso!');
      }

      const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password,
        userType,
        ...(userType === 'atleta' && professorId && { professorId }),
        ...(userType === 'atleta' && sport && { sport }),
        ...(userType === 'atleta' && position && { position }),
      };

      await AsyncStorage.setItem(
        '@GestaoTimes:users',
        JSON.stringify([...parsedUsers, newUser])
      );

      await AsyncStorage.setItem('@GestaoTimes:user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error; // Isso permite que o componente capture e exiba o erro
    } finally {
      setIsLoading(false);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function AgendaAtleta() {
  const { user } = useAuth();
  const { events } = useAppData();
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    // Marcar datas com eventos
    const marked = {};
    events.forEach(event => {
      const date = event.date.split('T')[0];
      marked[date] = {
        marked: true,
        dotColor: event.type === 'jogo' ? '#4CAF50' : '#2196F3'
      };
    });
    setMarkedDates(marked);
  }, [events]);

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date.startsWith(date));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
      </View>

      <Calendar
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#0066FF'
          }
        }}
        theme={{
          todayTextColor: '#0066FF',
          arrowColor: '#0066FF',
          dotColor: '#0066FF',
          selectedDayBackgroundColor: '#0066FF'
        }}
      />

      <ScrollView style={styles.eventsContainer}>
        {selectedDate ? (
          getEventsForDate(selectedDate).map(event => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Ionicons
                  name={event.type === 'jogo' ? 'football' : 'fitness'}
                  size={24}
                  color={event.type === 'jogo' ? '#4CAF50' : '#2196F3'}
                />
                <Text style={styles.eventTitle}>{event.title}</Text>
              </View>
              <Text style={styles.eventTime}>{event.time}</Text>
              <Text style={styles.eventDescription}>{event.description}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEventsText}>Selecione uma data para ver os eventos</Text>
        )}
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 24,
  },
});
