import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Text, Card, Button, Portal, Dialog, Chip, PaperProvider, MD3LightTheme, Avatar, Surface, useTheme, Menu, Divider, FAB } from 'react-native-paper';
import { Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AddPlayerModal } from '../../components/AddPlayerModal';
import { useFocusEffect } from '@react-navigation/native';

// Comandos de feedback pré-prontos
const COMANDOS_FEEDBACK = [
  'Excelente desempenho no treino',
  'Precisa melhorar a técnica',
  'Bom trabalho em equipe',
  'Necessita mais dedicação',
  'Ótimo progresso',
  'Falta pontualidade',
  'Bom comportamento',
  'Precisa melhorar a comunicação',
];

// Adicionar mais posições esportivas
const POSICOES = {
  futebol: ['Atacante', 'Meio-Campo', 'Defensor', 'Goleiro', 'Lateral', 'Volante', 'Ponta'],
  volei: ['Levantador', 'Ponteiro', 'Central', 'Oposto', 'Líbero', 'Atacante'],
  basquete: ['Armador', 'Ala', 'Ala-Pivô', 'Pivô', 'Escolta'],
  handebol: ['Goleiro', 'Ponta', 'Meia', 'Armador', 'Pivô'],
};

// Adicionar mais estatísticas
const ESTATISTICAS = {
  futebol: ['Gols', 'Assistências', 'Desarmes', 'Passes', 'Faltas', 'Cartões'],
  volei: ['Pontos', 'Bloqueios', 'Saque', 'Recepção', 'Levantamento'],
  basquete: ['Pontos', 'Rebotes', 'Assistências', 'Roubadas', 'Bloqueios'],
  handebol: ['Gols', 'Assistências', 'Bloqueios', 'Roubadas', 'Faltas'],
};

interface Feedback {
  mensagem: string;
  data: string;
  professor: string;
}

// Interface para jogador
interface Jogador {
  id: string;
  name: string;
  position: string;
  sport: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  feedbacks?: Feedback[];
  stats?: {
    goals: number;
    assists: number;
    games: number;
    cards: number;
  };
  profile?: {
    age: number;
    height?: string;
    weight?: string;
    photo?: string;
  };
}

export default function JogadoresScreen() {
  const theme = useTheme();
  const { players, teams, updatePlayer, reloadData, addPlayer, debugStorage } = useAppData();
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [timeFiltro, setTimeFiltro] = useState('');
  const [esporteFiltro, setEsporteFiltro] = useState('');
  const [posicaoFiltro, setPosicaoFiltro] = useState('');
  const [jogadorSelecionado, setJogadorSelecionado] = useState<Jogador | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRelatorios, setShowRelatorios] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, Feedback[]>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const scrollY = new Animated.Value(0);

  // Recarregar dados quando a tela ganha foco (mas não muito frequentemente)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Tela Jogadores ganhou foco');
      // Aguardar um pouco antes de recarregar para evitar conflitos
      const timeoutId = setTimeout(() => {
        reloadData(false); // Não forçar recarregamento
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }, [])
  );

  // Limpar dados fictícios ao iniciar
  React.useEffect(() => {
    const limparDadosFicticios = async () => {
      try {
        // Limpar jogadores
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify([]));
        
        // Limpar feedbacks
        await AsyncStorage.setItem('feedbacks', JSON.stringify({}));
        
        // Limpar times
        await AsyncStorage.setItem('@GestaoTimes:teams', JSON.stringify([]));
        
        // Limpar eventos
        await AsyncStorage.setItem('@GestaoTimes:events', JSON.stringify([]));
        
        console.log('✅ Dados fictícios removidos com sucesso');
      } catch (error) {
        console.error('❌ Erro ao limpar dados fictícios:', error);
      }
    };

    limparDadosFicticios();
  }, []);

  // Carregar feedbacks do storage
  React.useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        const storedFeedbacks = await AsyncStorage.getItem('feedbacks');
        if (storedFeedbacks) {
          setFeedbacks(JSON.parse(storedFeedbacks));
        }
      } catch (error) {
        console.error('Erro ao carregar feedbacks:', error);
      }
    };
    loadFeedbacks();
  }, []);

  // Lista de times para filtro
  const times = useMemo(() => {
    // Criar um objeto com IDs únicos
    const uniqueTeams = teams.reduce((acc, team) => {
      if (!acc[team.id]) {
        acc[team.id] = team;
      }
      return acc;
    }, {} as Record<string, typeof teams[0]>);

    // Converter para array
    return Object.values(uniqueTeams);
  }, [teams]);

  // Lista de jogadores filtrados
  const jogadoresFiltrados = useMemo(() => {
    return players.filter(jogador => {
      const matchBusca = jogador.name.toLowerCase().includes(busca.toLowerCase());
      const matchTime = !timeFiltro || jogador.teamId === timeFiltro;
      const matchEsporte = !esporteFiltro || jogador.sport === esporteFiltro;
      const matchPosicao = !posicaoFiltro || jogador.position === posicaoFiltro;
      return matchBusca && matchTime && matchEsporte && matchPosicao;
    });
  }, [players, busca, timeFiltro, esporteFiltro, posicaoFiltro]);

  const jogadoresSemTime = useMemo(() => {
    return players.filter(j => !j.teamId || j.teamId === '');
  }, [players]);

  const enviarFeedback = async (mensagem: string) => {
    if (!jogadorSelecionado || !user) return;

    const novoFeedback: Feedback = {
      mensagem,
      data: new Date().toISOString(),
      professor: user.name || 'Professor',
    };

    const feedbacksAtualizados = [
      ...(jogadorSelecionado.feedbacks || []),
      novoFeedback,
    ];

    const jogadorAtualizado = {
      ...jogadorSelecionado,
      feedbacks: feedbacksAtualizados,
    };

    try {
      await updatePlayer(jogadorSelecionado.id, jogadorAtualizado);
      setJogadorSelecionado(jogadorAtualizado);
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [140, 80],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Sem time';
  };

  const getSportColor = (sport: string) => {
    switch (sport?.toLowerCase()) {
      case 'futebol': return '#4CAF50';
      case 'volei': case 'vôlei': return '#FF9800';
      case 'basquete': return '#FF5722';
      case 'futsal': return '#2196F3';
      case 'handebol': return '#9C27B0';
      default: return '#666';
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Refresh manual dos dados de jogadores...');
    await reloadData(true);
  };

  const handleTestPlayer = async () => {
    try {
      console.log('🧪 Criando jogador de teste...');
      const testPlayer = {
        name: `Jogador Teste ${Date.now()}`,
        sport: 'futebol',
        position: 'Atacante',
        teamId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          goals: 0,
          assists: 0,
          games: 0,
          cards: 0,
        },
        profile: {
          age: 20,
        },
      };
      
      await addPlayer(testPlayer);
      console.log('✅ Jogador de teste criado');
      
      // Aguardar e verificar se ainda está lá
      setTimeout(async () => {
        console.log('🔍 Verificando se jogador ainda existe...');
        await debugStorage();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao criar jogador de teste:', error);
    }
  };

  return (
    <PaperProvider theme={MD3LightTheme}>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Jogadores',
            headerTransparent: true,
            headerBlurEffect: 'light',
            headerStyle: {
              backgroundColor: 'transparent',
            },
            headerTintColor: '#fff',
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => setMenuVisible(true)}
                style={styles.menuButton}
              >
                <MaterialCommunityIcons name="filter-variant" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          }} 
        />
        
        {/* Menu de Filtros */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: Dimensions.get('window').width - 50, y: 50 }}
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            title="Filtrar por Esporte"
            leadingIcon="basketball"
            onPress={() => {
              setMenuVisible(false);
              // Mostrar modal de seleção de esporte
            }}
          />
          <Divider />
          <Menu.Item
            title="Filtrar por Posição"
            leadingIcon="account-group"
            onPress={() => {
              setMenuVisible(false);
              // Mostrar modal de seleção de posição
            }}
          />
          <Divider />
          <Menu.Item
            title="Limpar Filtros"
            leadingIcon="filter-remove"
            onPress={() => {
              setEsporteFiltro('');
              setPosicaoFiltro('');
              setMenuVisible(false);
            }}
          />
        </Menu>

        {/* Header Animado */}
        <Animated.View style={[styles.headerContainer, { height: headerHeight, opacity: headerOpacity }]}>
          <LinearGradient
            colors={['#0066FF', '#00B4D8']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Jogadores</Text>
              <View style={styles.headerStats}>
                <View style={styles.headerStat}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#fff" />
                  <Text style={styles.headerStatText}>{players.length} Jogadores</Text>
                </View>
                <View style={styles.headerStat}>
                  <MaterialCommunityIcons name="trophy" size={20} color="#fff" />
                  <Text style={styles.headerStatText}>{teams.length} Times</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Conteúdo Principal */}
        <View style={styles.mainContent}>
          {/* Barra de Busca */}
          <View style={styles.searchWrapper}>
            <Surface style={styles.searchSurface} elevation={4}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.busca}
                  placeholder="Buscar jogador..."
                  placeholderTextColor="#999"
                  value={busca}
                  onChangeText={setBusca}
                />
                {busca.length > 0 && (
                  <TouchableOpacity onPress={() => setBusca('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </Surface>
          </View>
          
          {/* Filtros */}
          <View style={styles.filtrosWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filtrosContainer}
              contentContainerStyle={styles.filtrosContent}
            >
              <Chip
                key="filter-all-teams"
                selected={!timeFiltro}
                onPress={() => setTimeFiltro('')}
                style={[styles.filtroChip, !timeFiltro && styles.filtroChipSelected]}
                mode="outlined"
                icon="account-group"
              >
                Todos
              </Chip>
              
              {times.map(time => (
                <Chip
                  key={time.id}
                  selected={timeFiltro === time.id}
                  onPress={() => setTimeFiltro(time.id)}
                  style={[styles.filtroChip, timeFiltro === time.id && styles.filtroChipSelected]}
                  mode="outlined"
                  icon="tshirt-crew"
                >
                  {time.name}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Lista de Jogadores */}
          <Animated.ScrollView 
            style={styles.lista}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {jogadoresFiltrados.map(jogador => {
              const team = teams.find(t => t.id === jogador.teamId);
              const jogadorFeedbacks = feedbacks[jogador.id] || [];
              
              // Verifica se tem dados para mostrar
              const temGols = jogador.stats?.goals > 0;
              const temAssistencias = jogador.stats?.assists > 0;
              const temFeedbacks = jogadorFeedbacks.length > 0;
              
              return (
                <Card 
                  key={jogador.id} 
                  style={styles.card}
                  onPress={() => {
                    setJogadorSelecionado(jogador);
                    setShowModal(true);
                  }}
                >
                  <LinearGradient
                    colors={['#fff', '#f8f9fa']}
                  >
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.jogadorInfo}>
                        <Avatar.Text 
                          size={45} 
                          label={jogador.name.split(' ').map(n => n[0]).join('')} 
                          style={{ backgroundColor: getSportColor(jogador.sport) }}
                          labelStyle={styles.avatarLabel}
                        />
                        <View style={styles.jogadorDetalhes}>
                          <Text style={styles.nomeJogador}>{jogador.name}</Text>
                          <View style={styles.infoContainer}>
                            <View style={styles.infoItem}>
                              <MaterialCommunityIcons name="tshirt-crew" size={14} color="#0066FF" />
                              <Text style={styles.infoText}>{team?.name || 'Sem time'}</Text>
                            </View>
                            <View style={styles.infoItem}>
                              <MaterialCommunityIcons name="soccer" size={14} color="#0066FF" />
                              <Text style={styles.infoText}>{jogador.position}</Text>
                            </View>
                            <View style={styles.infoItem}>
                              <FontAwesome5 name={getSportIcon(jogador.sport)} size={12} color="#0066FF" />
                              <Text style={styles.infoText}>{jogador.sport}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      {/* Estatísticas - Só mostra se tiver dados */}
                      {(temGols || temAssistencias || temFeedbacks) && (
                        <View style={styles.statsContainer}>
                          {temGols && (
                            <>
                              <View style={styles.statItem}>
                                <MaterialCommunityIcons name="soccer" size={20} color="#0066FF" />
                                <Text style={styles.statValue}>{jogador.stats.goals}</Text>
                                <Text style={styles.statLabel}>Gols</Text>
                              </View>
                              {(temAssistencias || temFeedbacks) && <View style={styles.statDivider} />}
                            </>
                          )}
                          
                          {temAssistencias && (
                            <>
                              <View style={styles.statItem}>
                                <MaterialCommunityIcons name="handshake" size={20} color="#0066FF" />
                                <Text style={styles.statValue}>{jogador.stats.assists}</Text>
                                <Text style={styles.statLabel}>Assist.</Text>
                              </View>
                              {temFeedbacks && <View style={styles.statDivider} />}
                            </>
                          )}
                          
                          {temFeedbacks && (
                            <View style={styles.statItem}>
                              <MaterialCommunityIcons name="message-text" size={20} color="#0066FF" />
                              <Text style={styles.statValue}>{jogadorFeedbacks.length}</Text>
                              <Text style={styles.statLabel}>Feedbacks</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </Card.Content>
                  </LinearGradient>
                </Card>
              );
            })}
          </Animated.ScrollView>
        </View>

        {/* FAB para adicionar jogador */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowAddPlayerModal(true)}
          label="Adicionar Jogador"
        />

        {/* Modal de Feedback */}
        <Portal>
          <Dialog
            visible={showModal}
            onDismiss={() => setShowModal(false)}
            style={styles.modal}
          >
            <BlurView intensity={20} style={styles.modalBlur}>
              <Dialog.Title style={styles.modalTitle}>
                <MaterialCommunityIcons name="message-text" size={24} color="#0066FF" />
                <Text style={styles.modalTitleText}>
                  Feedback - {jogadorSelecionado?.name}
                </Text>
              </Dialog.Title>
              <Dialog.Content>
                <ScrollView style={styles.comandosContainer}>
                  {COMANDOS_FEEDBACK.map((comando, index) => (
                    <Chip
                      key={index}
                      onPress={() => enviarFeedback(comando)}
                      style={styles.comandoButton}
                    >
                      {comando}
                    </Chip>
                  ))}
                </ScrollView>

                <Button
                  mode="contained"
                  onPress={() => {
                    setShowModal(false);
                    setShowRelatorios(true);
                  }}
                  style={styles.verRelatoriosButton}
                  icon="file-document"
                  contentStyle={styles.verRelatoriosButtonContent}
                >
                  Ver Relatórios
                </Button>
              </Dialog.Content>
            </BlurView>
          </Dialog>
        </Portal>

        {/* Modal de Relatórios */}
        <Portal>
          <Dialog
            visible={showRelatorios}
            onDismiss={() => setShowRelatorios(false)}
            style={styles.modal}
          >
            <BlurView intensity={20} style={styles.modalBlur}>
              <Dialog.Title style={styles.modalTitle}>
                <MaterialCommunityIcons name="file-document" size={24} color="#0066FF" />
                <Text style={styles.modalTitleText}>
                  Relatórios - {jogadorSelecionado?.name}
                </Text>
              </Dialog.Title>
              <Dialog.Content>
                <ScrollView style={styles.relatoriosContainer}>
                  {(feedbacks[jogadorSelecionado?.id] || []).map((relatorio, index) => (
                    <Card key={index} style={styles.relatorioCard}>
                      <Card.Content>
                        <Text style={styles.relatorioMensagem}>{relatorio.mensagem}</Text>
                        <View style={styles.relatorioInfo}>
                          <View style={styles.relatorioInfoItem}>
                            <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                            <Text style={styles.relatorioData}>{relatorio.data}</Text>
                          </View>
                          <View style={styles.relatorioInfoItem}>
                            <MaterialCommunityIcons name="account" size={14} color="#666" />
                            <Text style={styles.relatorioProfessor}>{relatorio.professor}</Text>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </ScrollView>
              </Dialog.Content>
            </BlurView>
          </Dialog>
        </Portal>

        <AddPlayerModal 
          visible={showAddPlayerModal} 
          onClose={() => setShowAddPlayerModal(false)} 
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

// Função auxiliar para obter o ícone do esporte
function getSportIcon(sport: string): string {
  if (!sport) return 'question';
  
  const sportLower = sport.toLowerCase();
  switch (sportLower) {
    case 'futebol':
      return 'futbol';
    case 'volei':
      return 'volleyball-ball';
    case 'basquete':
      return 'basketball-ball';
    case 'handebol':
      return 'hand-holding';
    default:
      return 'question';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  headerContent: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  headerStatText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 13,
  },
  mainContent: {
    flex: 1,
    marginTop: 100,
  },
  searchWrapper: {
    marginHorizontal: 12,
    marginBottom: 8,
  },
  searchSurface: {
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  busca: {
    flex: 1,
    padding: 8,
    fontSize: 15,
    color: '#333',
  },
  filtrosWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginBottom: 8,
  },
  filtrosContainer: {
    flexGrow: 0,
  },
  filtrosContent: {
    paddingHorizontal: 12,
  },
  filtroChip: {
    marginRight: 6,
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  filtroChipSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  lista: {
    flex: 1,
    paddingHorizontal: 12,
  },
  card: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  jogadorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#0066FF',
    marginRight: 12,
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jogadorDetalhes: {
    flex: 1,
  },
  nomeJogador: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#0066FF',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066FF',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  modal: {
    backgroundColor: 'transparent',
  },
  modalBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  comandosContainer: {
    maxHeight: 300,
  },
  comandoButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  verRelatoriosButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  verRelatoriosButtonContent: {
    paddingVertical: 8,
  },
  relatoriosContainer: {
    maxHeight: 400,
  },
  relatorioCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  relatorioMensagem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  relatorioInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  relatorioInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatorioData: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  relatorioProfessor: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066FF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    padding: 5,
  },
  refreshButton: {
    padding: 5,
  },
}); 