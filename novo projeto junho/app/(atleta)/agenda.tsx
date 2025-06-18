import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';

interface Event {
  id: string;
  title: string;
  type: 'jogo' | 'treino' | 'reuniao';
  sport: string;
  date: string;
  time: string;
  description: string;
  location?: string;
}

export default function Agenda() {
  const { user } = useAuth();
  const { getEventsBySport } = useAppData();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user?.sport) {
      const upcoming = getEventsBySport(user.sport)
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(upcoming);
    }
  }, [user, getEventsBySport]);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum evento agendado</Text>
          </View>
        ) : (
          events.map(event => (
            <View key={event.id} style={styles.card}>
              <View style={styles.header}>
                <Ionicons
                  style={styles.icon}
                  size={20}
                  color="#4CAF50"
                  name={
                    event.type === 'jogo'
                      ? 'football'
                      : event.type === 'treino'
                      ? 'fitness'
                      : 'people'
                  }
                />
                <Text style={styles.title}>{event.title}</Text>
              </View>
              <Text style={styles.date}>
                {new Date(event.date).toLocaleDateString('pt-BR')} - {event.time}
              </Text>
              {event.location ? (
                <Text style={styles.location}>📍 {event.location}</Text>
              ) : null}
              {event.description ? (
                <Text style={styles.description}>{event.description}</Text>
              ) : null}
            </View>
          ))
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
  content: {
    padding: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    color: '#666',
    marginBottom: 4,
  },
  location: {
    color: '#666',
    marginBottom: 4,
  },
  description: {
    color: '#444',
  },
});
