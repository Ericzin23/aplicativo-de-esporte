import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSportConfig, getSportEvents } from '../../utils/sportsConfig';

interface Evento {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  local: string;
  status: 'agendado' | 'confirmado' | 'cancelado';
}

export default function AgendaAtleta() {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventos();
  }, []);

  async function loadEventos() {
    try {
      setLoading(true);
      const storedEvents = await AsyncStorage.getItem(`@GestaoTimes:events_${user?.id}`);
      
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        
        // Verificar se os eventos são válidos para o esporte
        const sportConfig = getSportConfig(user?.sport || 'futebol');
        const validEventTypes = sportConfig?.eventTypes || [];
        
        const validEvents = events.filter((e: Evento) => 
          validEventTypes.includes(e.tipo)
        );
        
        setEventos(validEvents.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()));
      } else {
        setEventos([]);
      }
    } catch (error) {
      console.log('Erro ao carregar eventos:', error);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'treino':
        return 'fitness';
      case 'jogo':
        return 'trophy';
      case 'reuniao':
        return 'people';
      case 'avaliacao':
        return 'clipboard';
      case 'recuperacao':
        return 'medkit';
      default:
        return 'calendar';
    }
  };

  const getEventColor = (tipo: string) => {
    switch (tipo) {
      case 'treino':
        return '#4CAF50';
      case 'jogo':
        return '#2196F3';
      case 'reuniao':
        return '#FF9800';
      case 'avaliacao':
        return '#E91E63';
      case 'recuperacao':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>
            {user?.sport ? `Eventos para ${user.sport}` : 'Eventos'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando eventos...</Text>
          </View>
        ) : eventos.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="calendar-outline" size={48} color="#757575" />
            <Text style={styles.noDataText}>
              Aguardando agendamento de eventos
            </Text>
          </View>
        ) : (
          eventos.map((evento) => (
            <View key={evento.id} style={styles.eventoCard}>
              <View style={styles.eventoHeader}>
                <View style={styles.eventoIconContainer}>
                  <Ionicons
                    name={getEventIcon(evento.tipo)}
                    size={24}
                    color={getEventColor(evento.tipo)}
                  />
                </View>
                <View style={styles.eventoInfo}>
                  <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
                  <Text style={styles.eventoData}>
                    {formatarData(evento.data)} às {evento.hora}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        evento.status === 'confirmado'
                          ? '#4CAF50'
                          : evento.status === 'cancelado'
                          ? '#F44336'
                          : '#FFC107',
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.eventoDescricao}>{evento.descricao}</Text>
              <Text style={styles.eventoLocal}>
                <Ionicons name="location" size={14} color="#666" /> {evento.local}
              </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginTop: 16,
  },
  eventoCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventoData: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  eventoDescricao: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventoLocal: {
    fontSize: 12,
    color: '#666',
  },
}); 