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
import { Calendar } from 'react-native-calendars';
import { format, startOfWeek, addDays, isSameWeek } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';

interface Evento {
  id: string;
  title: string;
  type: 'jogo' | 'treino' | 'reuniao';
  sport: string;
  date: string;
  time: string;
  description: string;
  location?: string;
  status?: 'agendado' | 'confirmado' | 'cancelado';
}

export default function AgendaAtleta() {
  const { user } = useAuth();
  const { events, getEventsBySport } = useAppData();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'lista' | 'semana' | 'mes'>('lista');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const loadEventos = () => {
      setLoading(true);
      try {
        let evs = user?.sport ? getEventsBySport(user.sport) : events;
        evs = evs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setEventos(evs as any);
      } catch (err) {
        console.log('Erro ao carregar eventos:', err);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };
    loadEventos();
  }, [events, user]);

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

  const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }).map((_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  );

  const eventosSemana = eventos.filter(e =>
    isSameWeek(new Date(e.date), new Date(selectedDate), { weekStartsOn: 1 })
  );

  const eventosDia = eventos.filter(e => e.date === selectedDate);

  const markedDates = eventos.reduce((acc: any, ev) => {
    const color = getEventColor(ev.type);
    if (!acc[ev.date]) acc[ev.date] = { dots: [], marked: true };
    if (!acc[ev.date].dots.find((d: any) => d.color === color)) {
      acc[ev.date].dots.push({ key: `${ev.type}-${color}`, color });
    }
    return acc;
  }, {} as Record<string, any>);

  const renderEventsList = (lista: Evento[]) => (
    <>
      {lista.map((evento) => (
        <View key={evento.id} style={styles.eventoCard}>
          <View style={styles.eventoHeader}>
            <View style={styles.eventoIconContainer}>
              <Ionicons
                name={getEventIcon(evento.type)}
                size={24}
                color={getEventColor(evento.type)}
              />
            </View>
            <View style={styles.eventoInfo}>
              <Text style={styles.eventoTitulo}>{evento.title}</Text>
              <Text style={styles.eventoData}>
                {formatarData(evento.date)} às {evento.time}
              </Text>
            </View>
            {evento.status && (
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
                  {evento.status.charAt(0).toUpperCase() +
                    evento.status.slice(1)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.eventoDescricao}>{evento.description}</Text>
          {evento.location && (
            <Text style={styles.eventoLocal}>
              <Ionicons name="location" size={14} color="#666" /> {evento.location}
            </Text>
          )}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>
            {user?.sport ? `Eventos para ${user.sport}` : 'Eventos'}
          </Text>
        </View>

        <View style={styles.viewSelector}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'lista' && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode('lista')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === 'lista' && styles.viewButtonTextActive,
              ]}
            >
              Lista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'semana' && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode('semana')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === 'semana' && styles.viewButtonTextActive,
              ]}
            >
              Semana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'mes' && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode('mes')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === 'mes' && styles.viewButtonTextActive,
              ]}
            >
              Mês
            </Text>
          </TouchableOpacity>
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
        ) : viewMode === 'lista' ? (
          renderEventsList(eventos)
        ) : viewMode === 'semana' ? (
          weekDates.map((date) => (
            <View key={date} style={styles.weekDayContainer}>
              <Text style={styles.weekDayTitle}>{formatarData(date)}</Text>
              {renderEventsList(eventos.filter((e) => e.date === date))}
            </View>
          ))
        ) : (
          <>
            <Calendar
              current={selectedDate}
              markingType="multi-dot"
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
            />
            {renderEventsList(eventosDia)}
          </>
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
  viewSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  viewButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#666',
  },
  viewButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  weekDayContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  weekDayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
});
