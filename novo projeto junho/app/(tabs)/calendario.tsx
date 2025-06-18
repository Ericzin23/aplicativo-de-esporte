import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppData, Event } from '../../contexts/AppDataContext';
import { AddEventModal } from '../../components/AddEventModal';


export default function Calendario() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedSport, setSelectedSport] = useState('Todos');
  const [selectedEventType, setSelectedEventType] = useState('Todos');
  const { events, getEventsBySport } = useAppData();

  // Esportes e tipos de evento disponíveis
  const sports = ['Todos', 'Futebol', 'Vôlei', 'Basquete', 'Futsal', 'Handebol'];
  const eventTypes = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Jogos', value: 'jogo' },
    { label: 'Treinos', value: 'treino' },
    { label: 'Reuniões', value: 'reuniao' },
  ];

  // Filtrar eventos
  const getFilteredEvents = () => {
    let filtered = events;
    
    // Filtro por esporte
    if (selectedSport !== 'Todos') {
      const sportKey = selectedSport.toLowerCase();
      filtered = getEventsBySport(sportKey);
    }
    
    // Filtro por tipo
    if (selectedEventType !== 'Todos') {
      filtered = filtered.filter(event => event.type === selectedEventType);
    }
    
    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'jogo': return 'football-outline';
      case 'treino': return 'fitness-outline';
      case 'reuniao': return 'people-outline';
      default: return 'calendar-outline';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'jogo': return '#4CAF50';
      case 'treino': return '#2196F3';
      case 'reuniao': return '#FF9800';
      default: return '#666';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'futebol': return 'football';
      case 'volei': case 'vôlei': return 'basketball';
      case 'basquete': return 'basketball';
      case 'futsal': return 'football';
      case 'handebol': return 'basketball';
      default: return 'fitness';
    }
  };

  const getSportColor = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'futebol': return '#4CAF50';
      case 'volei': case 'vôlei': return '#FF9800';
      case 'basquete': return '#FF5722';
      case 'futsal': return '#2196F3';
      case 'handebol': return '#9C27B0';
      default: return '#666';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'jogo': return 'Jogo';
      case 'treino': return 'Treino';
      case 'reuniao': return 'Reunião';
      default: return 'Evento';
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEventPress = (event: Event) => {
    const sportLabel = sports.find(s => s.toLowerCase() === event.sport) || event.sport;
    Alert.alert(
      event.title,
      `Esporte: ${sportLabel}\nTipo: ${getEventTypeLabel(event.type)}\nData: ${new Date(event.date).toLocaleDateString('pt-BR')}\nHorário: ${event.time}\nLocal: ${event.location || 'Não informado'}\n\n${event.description || ''}`,
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Editar', onPress: () => {
            setEditingEvent(event);
            setShowEventModal(true);
          } }
      ]
    );
  };

  const handleDayPress = (dateString: string) => {
    setSelectedDate(dateString);
    const dayEvents = filteredEvents.filter(event => event.date === dateString);
    if (dayEvents.length === 0) {
      Alert.alert(
        'Adicionar Evento',
        `Deseja criar um evento para ${new Date(dateString).toLocaleDateString('pt-BR')}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Criar Evento', onPress: () => setShowEventModal(true) }
        ]
      );
    }
  };

  // Gerar dias do mês atual
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Adicionar dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null, isEmpty: true });
    }
    
    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateString = date.toISOString().split('T')[0];
      const hasEvents = filteredEvents.some(event => event.date === dateString);
      
      days.push({
        day: i,
        date: dateString,
        isToday: dateString === new Date().toISOString().split('T')[0],
        hasEvents,
        isEmpty: false,
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedDateEvents = filteredEvents.filter(event => event.date === selectedDate);
  const todayEvents = filteredEvents.filter(event => event.date === new Date().toISOString().split('T')[0]);
  const upcomingEvents = filteredEvents.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate > today;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  // Estatísticas dos eventos filtrados
  const getEventStats = () => {
    return {
      jogos: filteredEvents.filter(e => e.type === 'jogo').length,
      treinos: filteredEvents.filter(e => e.type === 'treino').length,
      reunioes: filteredEvents.filter(e => e.type === 'reuniao').length,
    };
  };

  const eventStats = getEventStats();

  const currentDate = new Date();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendário</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddEvent}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Filtros */}
        <View style={styles.filtersSection}>
          {/* Filtro por Esporte */}
          <Text style={styles.filterTitle}>Filtrar por Esporte</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
            bounces={true}
          >
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.filterButton,
                  selectedSport === sport && styles.filterButtonActive
                ]}
                onPress={() => setSelectedSport(sport)}
                activeOpacity={0.7}
              >
                {sport !== 'Todos' && (
                  <Ionicons
                    name={getSportIcon(sport) as any}
                    size={14}
                    color={selectedSport === sport ? '#fff' : getSportColor(sport)}
                    style={styles.filterIcon}
                  />
                )}
                <Text style={[
                  styles.filterText,
                  selectedSport === sport && styles.filterTextActive
                ]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Filtro por Tipo de Evento */}
          <Text style={styles.filterTitle}>Filtrar por Tipo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
            bounces={true}
          >
            {eventTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeFilterButton,
                  selectedEventType === type.value && styles.typeFilterButtonActive
                ]}
                onPress={() => setSelectedEventType(type.value)}
                activeOpacity={0.7}
              >
                {type.value !== 'Todos' && (
                  <Ionicons
                    name={getEventIcon(type.value) as any}
                    size={14}
                    color={selectedEventType === type.value ? '#fff' : getEventColor(type.value)}
                    style={styles.filterIcon}
                  />
                )}
                <Text style={[
                  styles.typeFilterText,
                  selectedEventType === type.value && styles.typeFilterTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Mini Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <View style={styles.weekDays}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
              <Text key={index} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  day.isEmpty && styles.emptyDay,
                  day.isToday && styles.todayButton,
                  selectedDate === day.date && styles.selectedDayButton,
                  day.hasEvents && styles.dayWithEvents,
                ]}
                onPress={() => day.date && handleDayPress(day.date)}
                disabled={day.isEmpty}
                activeOpacity={0.7}
              >
                {!day.isEmpty && (
                  <>
                    <Text style={[
                      styles.dayText,
                      day.isToday && styles.todayText,
                      selectedDate === day.date && styles.selectedDayText,
                    ]}>
                      {day.day}
                    </Text>
                    {day.hasEvents && <View style={styles.eventDot} />}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Events Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{eventStats.jogos}</Text>
            <Text style={styles.summaryLabel}>Jogos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#2196F3' }]}>{eventStats.treinos}</Text>
            <Text style={styles.summaryLabel}>Treinos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#FF9800' }]}>{eventStats.reunioes}</Text>
            <Text style={styles.summaryLabel}>Reuniões</Text>
          </View>
        </View>

        {/* Selected Date Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Eventos - {new Date(selectedDate).toLocaleDateString('pt-BR')}
          </Text>
          <View style={styles.eventsContainer}>
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeIcon, { backgroundColor: getEventColor(event.type) + '20' }]}>
                      <Ionicons 
                        name={getEventIcon(event.type) as any} 
                        size={20} 
                        color={getEventColor(event.type)} 
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventTime}>{event.time}</Text>
                        <View style={styles.eventSportTag}>
                          <Ionicons
                            name={getSportIcon(event.sport) as any}
                            size={12}
                            color={getSportColor(event.sport)}
                          />
                          <Text style={[styles.eventSportText, { color: getSportColor(event.sport) }]}>
                            {event.sport.charAt(0).toUpperCase() + event.sport.slice(1)}
                          </Text>
                        </View>
                      </View>
                      {event.location && (
                        <Text style={styles.eventLocation}>📍 {event.location}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noEventsContainer}>
                <Ionicons name="calendar-outline" size={40} color="#ccc" />
                <Text style={styles.noEventsText}>
                  {(selectedSport !== 'Todos' || selectedEventType !== 'Todos')
                    ? 'Nenhum evento encontrado com os filtros aplicados'
                    : 'Nenhum evento nesta data'
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.addEventButton}
                  onPress={handleAddEvent}
                >
                  <Text style={styles.addEventButtonText}>Adicionar Evento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Today's Events */}
        {todayEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eventos de Hoje</Text>
            <View style={styles.eventsContainer}>
              {todayEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, styles.todayEventCard]}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeIcon, { backgroundColor: getEventColor(event.type) + '20' }]}>
                      <Ionicons 
                        name={getEventIcon(event.type) as any} 
                        size={20} 
                        color={getEventColor(event.type)} 
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventTime}>{event.time}</Text>
                        <View style={styles.eventSportTag}>
                          <Ionicons
                            name={getSportIcon(event.sport) as any}
                            size={12}
                            color={getSportColor(event.sport)}
                          />
                          <Text style={[styles.eventSportText, { color: getSportColor(event.sport) }]}>
                            {event.sport.charAt(0).toUpperCase() + event.sport.slice(1)}
                          </Text>
                        </View>
                      </View>
                      {event.location && (
                        <Text style={styles.eventLocation}>📍 {event.location}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <View style={styles.eventsContainer}>
              {upcomingEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.7}
                >
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeIcon, { backgroundColor: getEventColor(event.type) + '20' }]}>
                      <Ionicons 
                        name={getEventIcon(event.type) as any} 
                        size={20} 
                        color={getEventColor(event.type)} 
                      />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <Text style={styles.eventDate}>
                          {new Date(event.date).toLocaleDateString('pt-BR')} - {event.time}
                        </Text>
                        <View style={styles.eventSportTag}>
                          <Ionicons
                            name={getSportIcon(event.sport) as any}
                            size={12}
                            color={getSportColor(event.sport)}
                          />
                          <Text style={[styles.eventSportText, { color: getSportColor(event.sport) }]}>
                            {event.sport.charAt(0).toUpperCase() + event.sport.slice(1)}
                          </Text>
                        </View>
                      </View>
                      {event.location && (
                        <Text style={styles.eventLocation}>📍 {event.location}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <AddEventModal
        visible={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        selectedDate={selectedDate}
        event={editingEvent || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#0066FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filtersSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  filterContainer: {
    marginBottom: 5,
  },
  filterContent: {
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  typeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  typeFilterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    width: 35,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 18,
    position: 'relative',
  },
  emptyDay: {
    opacity: 0,
  },
  todayButton: {
    backgroundColor: '#0066FF',
  },
  selectedDayButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#0066FF',
  },
  dayWithEvents: {
    backgroundColor: '#fff3e0',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#0066FF',
    fontWeight: 'bold',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF9800',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    margin: 15,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  eventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayEventCard: {
    backgroundColor: '#f8f9ff',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 14,
    color: '#0066FF',
    fontWeight: '600',
  },
  eventSportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventSportText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  addEventButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addEventButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 