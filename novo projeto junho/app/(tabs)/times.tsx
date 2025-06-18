import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useFocusEffect } from '@react-navigation/native';
import { AddTeamModal } from '../../components/AddTeamModal';

interface Team {
  id: string;
  name: string;
  sport: string;
  players: any[];
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  professorId?: string;
}

interface Player {
  id: string;
  name: string;
  sport: string;
  position: string;
  teamId: string;
  stats?: {
    goals: number;
    assists: number;
    games: number;
    cards: number;
  };
  profile?: {
    age: number;
  };
  feedbacks?: any[];
}

const feedbackPorEsporte: { [key: string]: string[] } = {
  futebol: [
    'Você ficou muito parado na defesa.',
    'Boa movimentação sem bola.',
    'Melhore sua comunicação com o time.',
    'Bons passes curtos hoje.',
    'Faltou foco nas jogadas aéreas.',
    'Se posicionou bem nas jogadas rápidas.'
  ],
  volei: [
    'Bom posicionamento na recepção.',
    'Faltou tempo no bloqueio.',
    'A comunicação com o levantador pode melhorar.',
    'Ótimo saque!',
    'Preste atenção nas trocas de posição.',
    'Movimente-se mais sem a bola.'
  ],
  basquete: [
    'Você se destacou na marcação.',
    'Melhorar os arremessos de média distância.',
    'Boa leitura de contra-ataque.',
    'Faltou atenção nas jogadas rápidas.',
    'Foi bem no rebote defensivo.',
    'Boa movimentação sem bola.'
  ],
  generico: [
    'Ótimo empenho no treino!',
    'Faltou foco em alguns momentos.',
    'Você evoluiu bastante nas últimas semanas.',
    'Continue com essa dedicação!'
  ]
};

export default function Times() {
  const { user } = useAuth();
  const { teams, players, reloadData, debugStorage, addTeam } = useAppData();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Estados locais para fallback
  const [localTeams, setLocalTeams] = useState<Team[]>([]);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [useLocalData, setUseLocalData] = useState(false);
  const [forceShowData, setForceShowData] = useState(false);

  // Recarregar dados quando a tela ganha foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Tela Times ganhou foco');
      reloadData();
      loadLocalData(); // Também carregar dados locais
      
      // Forçar exibição de dados após 2 segundos se nada aparecer
      setTimeout(() => {
        if (currentTeams.length === 0 && currentPlayers.length === 0) {
          console.log('⚠️ Nenhum dado apareceu, forçando exibição');
          setForceShowData(true);
          createTestDataIfEmpty();
        }
      }, 2000);
    }, [])
  );

  // Função para criar dados de teste se não houver nada
  const createTestDataIfEmpty = async () => {
    try {
      console.log('🧪 Criando dados de teste...');
      
      // Verificar se realmente não há dados
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const teamsData = await AsyncStorage.getItem('@GestaoTimes:teams');
      
      const users = usersData ? JSON.parse(usersData) : [];
      const players = playersData ? JSON.parse(playersData) : [];
      const teams = teamsData ? JSON.parse(teamsData) : [];
      
      console.log('📊 Dados reais encontrados:', {
        users: users.length,
        players: players.length,
        teams: teams.length
      });
      
      // Se há usuários mas não há jogadores, converter
      const atletas = users.filter((u: any) => u.userType === 'atleta');
      if (atletas.length > 0 && players.length === 0) {
        console.log('🔄 Convertendo atletas em jogadores...');
        await handleConvertAllAtletasToPlayers();
        return;
      }
      
      // Se realmente não há nada, criar dados básicos para teste
      if (users.length === 0 && players.length === 0 && teams.length === 0) {
        console.log('🧪 Criando dados básicos de teste...');
        
        const testPlayers = [
          {
            id: 'test-player-1',
            name: 'Rafael Santos',
            sport: 'futebol',
            position: 'Atacante',
            teamId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: { goals: 0, assists: 0, games: 0, cards: 0 },
            profile: { age: 22 },
            feedbacks: []
          },
          {
            id: 'test-player-2',
            name: 'Maria Silva',
            sport: 'volei',
            position: 'Levantador',
            teamId: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: { goals: 0, assists: 0, games: 0, cards: 0 },
            profile: { age: 20 },
            feedbacks: []
          }
        ];
        
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(testPlayers));
        setLocalPlayers(testPlayers);
        setUseLocalData(true);
        
        Alert.alert(
          'Dados de Teste Criados',
          'Como não foram encontrados dados, criei alguns jogadores de teste (Rafael e Maria) para você testar o sistema.'
        );
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar dados de teste:', error);
    }
  };

  // Função para carregar dados diretamente do AsyncStorage
  const loadLocalData = async () => {
    try {
      console.log('📱 Carregando dados locais...');
      
      const teamsData = await AsyncStorage.getItem('@GestaoTimes:teams');
      const storageTeams = teamsData ? JSON.parse(teamsData) : [];
      
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const storagePlayers = playersData ? JSON.parse(playersData) : [];
      
      setLocalTeams(storageTeams);
      setLocalPlayers(storagePlayers);
      
      console.log('📱 Dados locais carregados:', {
        teams: storageTeams.length,
        players: storagePlayers.length
      });
      
      // Se o contexto não tem dados mas o storage tem, usar dados locais
      if (teams.length === 0 && storageTeams.length > 0) {
        console.log('⚠️ Contexto vazio, usando dados locais');
        setUseLocalData(true);
      } else if (teams.length > 0) {
        console.log('✅ Contexto com dados, usando contexto');
        setUseLocalData(false);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados locais:', error);
    }
  };

  // Escolher qual fonte de dados usar
  const currentTeams = useLocalData ? localTeams : teams;
  const currentPlayers = useLocalData ? localPlayers : players;

  // Filtrar times do professor atual
  const myTeams = user?.userType === 'professor' 
    ? currentTeams.filter((t: Team) => t.professorId === user?.id || !t.professorId) 
    : currentTeams;

  async function handleOpenPlayerModal(team: Team) {
    try {
      console.log('🔍 Abrindo modal para time:', team.name, 'esporte:', team.sport);
      
      // Recarregar jogadores do AsyncStorage para garantir dados atualizados
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const allPlayers = playersData ? JSON.parse(playersData) : [];
      
      console.log('👥 Total de jogadores no storage:', allPlayers.length);
      
      // Filtrar jogadores disponíveis (sem time) do mesmo esporte
      const filtrados = allPlayers.filter((p: any) => {
        const sameEsporte = p.sport?.toLowerCase() === team.sport?.toLowerCase();
        const semTime = !p.teamId || p.teamId === '';
        
        console.log(`🔍 Jogador ${p.name}:`, {
          sport: p.sport,
          teamId: p.teamId,
          sameEsporte,
          semTime,
          disponivel: sameEsporte && semTime
        });
        
        return sameEsporte && semTime;
      });
      
      console.log('👥 Jogadores disponíveis filtrados:', filtrados.length);
      filtrados.forEach((p: any, index: number) => {
        console.log(`  ${index + 1}. ${p.name} (${p.sport} - ${p.position})`);
      });
      
      setAvailablePlayers(filtrados);
      setSelectedTeam(team);
      setModalVisible(true);
    } catch (error) {
      console.error('❌ Erro ao abrir modal:', error);
    }
  }

  async function handleAddPlayerToTeam(player: Player) {
    if (!selectedTeam) return;
    
    try {
      console.log('➕ === INICIANDO ADIÇÃO DE JOGADOR ===');
      console.log('➕ Jogador:', player.name, 'ID:', player.id);
      console.log('➕ Time:', selectedTeam.name, 'ID:', selectedTeam.id);
      
      // 1. Carregar dados atuais do AsyncStorage
      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const allPlayers: Player[] = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      console.log('📊 Total de jogadores antes:', allPlayers.length);
      
      // 2. Verificar se o jogador ainda existe
      const playerExists = allPlayers.find(p => p.id === player.id);
      if (!playerExists) {
        console.error('❌ Jogador não encontrado no storage!');
        Alert.alert('Erro', 'Jogador não encontrado. Recarregue a tela e tente novamente.');
        return;
      }
      
      console.log('✅ Jogador encontrado:', playerExists.name, 'teamId atual:', playerExists.teamId);
      
      // 3. Verificar se o jogador já está em um time
      if (playerExists.teamId && playerExists.teamId !== '') {
        console.log('⚠️ Jogador já está em um time:', playerExists.teamId);
        Alert.alert('Aviso', 'Este jogador já está em outro time.');
        return;
      }
      
      // 4. Verificar se o time ainda existe
      const storedTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
      const allTeams = storedTeams ? JSON.parse(storedTeams) : [];
      const teamExists = allTeams.find((t: any) => t.id === selectedTeam.id);
      
      if (!teamExists) {
        console.error('❌ Time não encontrado no storage!');
        Alert.alert('Erro', 'Time não encontrado. Recarregue a tela e tente novamente.');
        return;
      }
      
      console.log('✅ Time encontrado:', teamExists.name);
      
      // 5. Atualizar o jogador com o ID do time
      const updatedPlayers = allPlayers.map(p => 
        p.id === player.id 
          ? { ...p, teamId: selectedTeam.id, updatedAt: new Date().toISOString() }
          : p
      );
      
      console.log('🔄 Jogador atualizado no array');
      
      // 6. Salvar com múltiplas tentativas
      let saveSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`💾 Tentativa de salvamento ${attempt}/3...`);
          
          await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
          
          // Verificar se foi salvo corretamente
          const verification = await AsyncStorage.getItem('@GestaoTimes:players');
          const verifiedPlayers = verification ? JSON.parse(verification) : [];
          
          const savedPlayer = verifiedPlayers.find((p: any) => p.id === player.id);
          
          if (savedPlayer && savedPlayer.teamId === selectedTeam.id) {
            console.log(`✅ Salvamento verificado na tentativa ${attempt}`);
            console.log('✅ Jogador salvo:', savedPlayer.name, 'teamId:', savedPlayer.teamId);
            saveSuccess = true;
            break;
          } else {
            console.log(`❌ Verificação falhou na tentativa ${attempt}`);
            console.log('❌ Dados salvos:', savedPlayer ? { name: savedPlayer.name, teamId: savedPlayer.teamId } : 'jogador não encontrado');
          }
        } catch (error) {
          console.error(`❌ Erro na tentativa ${attempt}:`, error);
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (!saveSuccess) {
        console.error('❌ Falha ao salvar após 3 tentativas');
        Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
        return;
      }
      
      // 7. Aguardar um pouco antes de recarregar
      console.log('⏱️ Aguardando antes de recarregar...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 8. Recarregar dados do contexto
      console.log('🔄 Recarregando dados do contexto...');
      await reloadData();
      
      // 9. Aguardar um pouco mais
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 10. Fechar modal e mostrar sucesso
      setModalVisible(false);
      
      console.log('✅ === ADIÇÃO CONCLUÍDA COM SUCESSO ===');
      Alert.alert('Sucesso!', `${player.name} foi adicionado ao time ${selectedTeam.name}!`);
      
      // 11. Monitoramento pós-adição
      setTimeout(async () => {
        console.log('🔍 === VERIFICAÇÃO PÓS-ADIÇÃO (5s) ===');
        try {
          const checkPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
          const playersAfter = checkPlayers ? JSON.parse(checkPlayers) : [];
          const playerAfter = playersAfter.find((p: any) => p.id === player.id);
          
          if (playerAfter && playerAfter.teamId === selectedTeam.id) {
            console.log('✅ Jogador ainda está no time após 5s:', playerAfter.name, '→', playerAfter.teamId);
          } else {
            console.error('❌ PROBLEMA: Jogador não está mais no time após 5s!');
            console.error('❌ Dados atuais:', playerAfter ? { name: playerAfter.name, teamId: playerAfter.teamId } : 'jogador não encontrado');
          }
          
          const checkTeams = await AsyncStorage.getItem('@GestaoTimes:teams');
          const teamsAfter = checkTeams ? JSON.parse(checkTeams) : [];
          const teamAfter = teamsAfter.find((t: any) => t.id === selectedTeam.id);
          
          if (teamAfter) {
            console.log('✅ Time ainda existe após 5s:', teamAfter.name);
          } else {
            console.error('❌ PROBLEMA: Time não existe mais após 5s!');
          }
        } catch (error) {
          console.error('❌ Erro na verificação pós-adição:', error);
        }
        console.log('🔍 === FIM VERIFICAÇÃO PÓS-ADIÇÃO ===');
      }, 5000);
      
    } catch (error) {
      console.error('❌ === ERRO NA ADIÇÃO DE JOGADOR ===');
      console.error('❌ Erro:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o jogador ao time. Tente novamente.');
    }
  }

  async function handleRemovePlayerFromTeam(player: Player) {
    try {
      console.log('➖ Removendo jogador do time:', player.name);
      
      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const allPlayers: Player[] = storedPlayers ? JSON.parse(storedPlayers) : [];
      
      // Atualizar o jogador removendo o ID do time
      const updatedPlayers = allPlayers.map(p => 
        p.id === player.id ? { ...p, teamId: '' } : p
      );
      
      // Salvar jogadores atualizados
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
      
      // Recarregar dados
      await reloadData();
      
      Alert.alert('Sucesso!', `${player.name} foi removido do time!`);
      
    } catch (error) {
      console.error('❌ Erro ao remover jogador do time:', error);
      Alert.alert('Erro', 'Não foi possível remover o jogador do time.');
    }
  }

  function abrirFeedback(player: Player) {
    setSelectedPlayer(player);
    setFeedbackModal(true);
  }

  async function enviarFeedback(mensagem: string) {
    if (!selectedPlayer) return;
    
    try {
      const novoFeedback = {
        mensagem,
        data: new Date().toISOString(),
        professor: user?.name || 'Professor',
      };

      const storedPlayers = await AsyncStorage.getItem('@GestaoTimes:players');
      const allPlayers: Player[] = storedPlayers ? JSON.parse(storedPlayers) : [];

      // Atualizar jogador com novo feedback
      const updatedPlayers = allPlayers.map(p => 
        p.id === selectedPlayer.id 
          ? { ...p, feedbacks: [...(p.feedbacks || []), novoFeedback] }
          : p
      );
      
      await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));

      // NOVO: Enviar feedback como orientação para o atleta específico
      await enviarOrientacaoParaAtleta(selectedPlayer, mensagem);
      
      setFeedbackModal(false);
      Alert.alert('Sucesso!', 'Feedback enviado para o atleta!');
      
    } catch (error) {
      console.error('❌ Erro ao enviar feedback:', error);
      Alert.alert('Erro', 'Não foi possível enviar o feedback.');
    }
  }

  // Função para enviar orientação específica para o atleta
  async function enviarOrientacaoParaAtleta(player: Player, mensagem: string) {
    try {
      console.log('📧 Enviando orientação para atleta:', player.name);
      
      // Encontrar o atleta correspondente pelo email ou ID
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = usersData ? JSON.parse(usersData) : [];
      
      // Procurar o atleta correspondente
      let atleta = null;
      
      // Primeira tentativa: por atletaEmail se existir
      if ((player as any).atletaEmail) {
        atleta = users.find((u: any) => 
          u.email === (player as any).atletaEmail && u.userType === 'atleta'
        );
      }
      
      // Segunda tentativa: por atletaId se existir
      if (!atleta && (player as any).atletaId) {
        atleta = users.find((u: any) => 
          u.id === (player as any).atletaId && u.userType === 'atleta'
        );
      }
      
      // Terceira tentativa: por nome e esporte
      if (!atleta) {
        atleta = users.find((u: any) => 
          u.name?.toLowerCase() === player.name?.toLowerCase() && 
          u.sport?.toLowerCase() === player.sport?.toLowerCase() &&
          u.userType === 'atleta'
        );
      }
      
      if (!atleta) {
        console.log('⚠️ Atleta não encontrado para o jogador:', player.name);
        return;
      }
      
      console.log('✅ Atleta encontrado:', atleta.name, atleta.email);
      
      // Criar nova orientação
      const novaOrientacao = {
        id: `orientacao-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tipo: 'feedback',
        titulo: `Feedback do Professor ${user?.name || 'Professor'}`,
        descricao: mensagem,
        data: new Date().toISOString(),
        lida: false,
        professorId: user?.id,
        professorName: user?.name || 'Professor',
        jogadorId: player.id,
        jogadorName: player.name,
        esporte: player.sport,
      };
      
      // Carregar orientações existentes do atleta
      const orientacoesKey = `@GestaoTimes:orientacoes_${atleta.id}`;
      const existingOrientacoesData = await AsyncStorage.getItem(orientacoesKey);
      const existingOrientacoes = existingOrientacoesData ? JSON.parse(existingOrientacoesData) : [];
      
      // Adicionar nova orientação
      const updatedOrientacoes = [novaOrientacao, ...existingOrientacoes];
      
      // Salvar orientações atualizadas
      await AsyncStorage.setItem(orientacoesKey, JSON.stringify(updatedOrientacoes));
      
      console.log('✅ Orientação salva para:', atleta.name);
      console.log('📧 Total de orientações do atleta:', updatedOrientacoes.length);
      
    } catch (error) {
      console.error('❌ Erro ao enviar orientação para atleta:', error);
    }
  }

  const getTeamPlayers = (teamId: string) => {
    return currentPlayers.filter(p => p.teamId === teamId);
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

  const getSportIcon = (sport: string) => {
    switch (sport?.toLowerCase()) {
      case 'futebol': return 'football';
      case 'volei': case 'vôlei': return 'basketball';
      case 'basquete': return 'basketball';
      case 'futsal': return 'football';
      case 'handebol': return 'basketball';
      default: return 'fitness';
    }
  };

  const handleDebug = async () => {
    console.log('🔍 Debug manual...');
    await debugStorage();
  };

  const handleRefresh = async () => {
    console.log('🔄 Refresh manual...');
    await reloadData();
  };

  // Função de teste para criar um time diretamente
  const handleTestCreateTeam = async () => {
    try {
      console.log('🧪 Testando criação de time...');
      
      await addTeam({
        name: `Time Teste ${Date.now()}`,
        sport: 'futebol',
        players: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        professorId: user?.id || '',
      });
      
      Alert.alert('Sucesso!', 'Time de teste criado!');
      await reloadData();
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      Alert.alert('Erro', 'Falha ao criar time de teste');
    }
  };

  // Função para limpar todos os dados (apenas para teste)
  const handleClearAllData = async () => {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@GestaoTimes:teams');
              await AsyncStorage.removeItem('@GestaoTimes:players');
              await AsyncStorage.removeItem('@GestaoTimes:events');
              await reloadData();
              Alert.alert('Sucesso!', 'Todos os dados foram limpos!');
            } catch (error) {
              console.error('❌ Erro ao limpar dados:', error);
              Alert.alert('Erro', 'Falha ao limpar dados');
            }
          }
        }
      ]
    );
  };

  // Função para verificar atletas e jogadores
  const handleCheckAtletas = async () => {
    try {
      console.log('🔍 === VERIFICANDO ATLETAS E JOGADORES ===');
      
      // Verificar usuários cadastrados
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = usersData ? JSON.parse(usersData) : [];
      
      console.log('👤 Total de usuários:', users.length);
      const atletas = users.filter((u: any) => u.userType === 'atleta');
      console.log('🏃‍♂️ Atletas cadastrados:', atletas.length);
      
      atletas.forEach((atleta: any, index: number) => {
        console.log(`🏃‍♂️ Atleta ${index + 1}:`, {
          id: atleta.id,
          name: atleta.name,
          email: atleta.email,
          sport: atleta.sport,
          position: atleta.position,
          userType: atleta.userType
        });
      });
      
      // Verificar jogadores
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = playersData ? JSON.parse(playersData) : [];
      
      console.log('👥 Total de jogadores:', players.length);
      players.forEach((player: any, index: number) => {
        console.log(`👥 Jogador ${index + 1}:`, {
          id: player.id,
          name: player.name,
          sport: player.sport,
          position: player.position,
          teamId: player.teamId
        });
      });
      
      // Verificar correspondência
      console.log('🔗 === VERIFICANDO CORRESPONDÊNCIA ===');
      const atletasSemJogador: any[] = [];
      
      atletas.forEach((atleta: any) => {
        const jogadorCorrespondente = players.find((p: any) => 
          p.name.toLowerCase() === atleta.name.toLowerCase() && 
          p.sport === atleta.sport
        );
        
        if (jogadorCorrespondente) {
          console.log(`✅ Atleta ${atleta.name} tem jogador correspondente:`, jogadorCorrespondente.id);
        } else {
          console.log(`❌ Atleta ${atleta.name} NÃO tem jogador correspondente!`);
          console.log('   - Dados do atleta:', { name: atleta.name, sport: atleta.sport, position: atleta.position });
          atletasSemJogador.push(atleta);
        }
      });
      
      console.log('🔍 === FIM DA VERIFICAÇÃO ===');
      
      if (atletasSemJogador.length > 0) {
        Alert.alert(
          'Atletas sem Jogadores',
          `Encontrados ${atletasSemJogador.length} atletas que não têm jogadores correspondentes.\n\nIsso significa que esses atletas não aparecerão como jogadores disponíveis para os times.\n\nO que deseja fazer?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Corrigir Existentes', 
              onPress: () => handleFixExistingPlayers()
            },
            { 
              text: 'Criar Jogadores', 
              onPress: () => handleCreateMissingPlayers(atletasSemJogador),
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert(
          'Verificação Completa',
          `✅ Todos os atletas têm jogadores correspondentes!\n\nAtletas: ${atletas.length}\nJogadores: ${players.length}\n\nTodos os atletas estão disponíveis para seleção nos times.`
        );
      }
      
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      Alert.alert('Erro', 'Falha na verificação');
    }
  };

  // Função para criar jogadores para atletas que não têm
  const handleCreateMissingPlayers = async (atletas: any[]) => {
    try {
      console.log('🔧 === CRIANDO JOGADORES PARA ATLETAS ===');
      console.log('🔧 Atletas sem jogador:', atletas.length);
      
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const existingPlayers = playersData ? JSON.parse(playersData) : [];
      const newPlayers = [...existingPlayers];
      
      console.log('👥 Jogadores existentes antes:', existingPlayers.length);
      
      let sucessCount = 0;
      let errorCount = 0;
      
      for (const atleta of atletas) {
        try {
          // Validar dados do atleta
          if (!atleta.sport || !atleta.position) {
            console.log(`⚠️ Pulando atleta ${atleta.name} - dados incompletos:`, {
              sport: atleta.sport,
              position: atleta.position
            });
            errorCount++;
            continue;
          }
          
          // Verificar se já existe (dupla verificação)
          const alreadyExists = newPlayers.find((p: any) => 
            p.name.toLowerCase() === atleta.name.toLowerCase() && 
            p.sport?.toLowerCase() === atleta.sport?.toLowerCase()
          );
          
          if (alreadyExists) {
            console.log(`⚠️ Jogador já existe para ${atleta.name}, pulando...`);
            continue;
          }
          
          // Criar novo jogador
          const newPlayer = {
            id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: atleta.name,
            sport: atleta.sport,
            position: atleta.position,
            teamId: '', // Sem time inicialmente - disponível para seleção
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
            feedbacks: [], // Array para feedbacks do professor
            // Dados do atleta original para referência
            atletaId: atleta.id,
            atletaEmail: atleta.email,
          };
          
          newPlayers.push(newPlayer);
          sucessCount++;
          
          console.log(`✅ Jogador criado para ${atleta.name}:`, {
            id: newPlayer.id,
            sport: newPlayer.sport,
            position: newPlayer.position,
            teamId: newPlayer.teamId
          });
          
        } catch (error) {
          console.error(`❌ Erro ao criar jogador para ${atleta.name}:`, error);
          errorCount++;
        }
      }
      
      // Salvar todos os jogadores com múltiplas tentativas
      console.log('💾 Salvando jogadores...');
      console.log('💾 Total a salvar:', newPlayers.length);
      
      let saveSuccess = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`💾 Tentativa de salvamento ${attempt}/5...`);
          
          await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(newPlayers));
          
          // Verificar se foi salvo corretamente
          const verification = await AsyncStorage.getItem('@GestaoTimes:players');
          const verifiedPlayers = verification ? JSON.parse(verification) : [];
          
          if (verifiedPlayers.length === newPlayers.length) {
            console.log(`✅ Salvamento verificado na tentativa ${attempt}`);
            console.log(`✅ Total de jogadores salvos: ${verifiedPlayers.length}`);
            saveSuccess = true;
            break;
          } else {
            console.log(`❌ Verificação falhou na tentativa ${attempt}:`);
            console.log(`❌ Esperado: ${newPlayers.length}, Salvo: ${verifiedPlayers.length}`);
          }
        } catch (error) {
          console.error(`❌ Erro na tentativa de salvamento ${attempt}:`, error);
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (!saveSuccess) {
        console.error('❌ Falha ao salvar jogadores após 5 tentativas');
        Alert.alert('Erro', 'Falha ao salvar jogadores. Tente novamente.');
        return;
      }
      
      // Recarregar dados
      console.log('🔄 Recarregando dados...');
      await loadLocalData(); // Recarregar dados locais
      await reloadData(); // Recarregar dados do contexto
      
      console.log('🔧 === CRIAÇÃO CONCLUÍDA ===');
      console.log(`✅ Sucessos: ${sucessCount}`);
      console.log(`❌ Erros: ${errorCount}`);
      
      Alert.alert(
        'Jogadores Criados!', 
        `✅ ${sucessCount} jogadores criados com sucesso!\n❌ ${errorCount} erros\n\nTodos os atletas agora têm jogadores correspondentes e estão disponíveis para seleção nos times.`
      );
      
    } catch (error) {
      console.error('❌ Erro geral ao criar jogadores:', error);
      Alert.alert('Erro', 'Falha ao criar jogadores');
    }
  };

  // Função para corrigir e validar jogadores existentes
  const handleFixExistingPlayers = async () => {
    try {
      console.log('🔧 === CORRIGINDO JOGADORES EXISTENTES ===');
      
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const existingPlayers = playersData ? JSON.parse(playersData) : [];
      
      console.log('👥 Jogadores existentes:', existingPlayers.length);
      
      let fixedCount = 0;
      const fixedPlayers = existingPlayers.map((player: any) => {
        let needsFix = false;
        const fixedPlayer = { ...player };
        
        // Garantir que tenha todas as propriedades necessárias
        if (!fixedPlayer.teamId) {
          fixedPlayer.teamId = '';
          needsFix = true;
        }
        
        if (!fixedPlayer.stats) {
          fixedPlayer.stats = {
            goals: 0,
            assists: 0,
            games: 0,
            cards: 0,
          };
          needsFix = true;
        }
        
        if (!fixedPlayer.profile) {
          fixedPlayer.profile = {
            age: 18,
            height: undefined,
            weight: undefined,
            photo: undefined,
          };
          needsFix = true;
        }
        
        if (!fixedPlayer.feedbacks) {
          fixedPlayer.feedbacks = [];
          needsFix = true;
        }
        
        if (!fixedPlayer.createdAt) {
          fixedPlayer.createdAt = new Date().toISOString();
          needsFix = true;
        }
        
        if (!fixedPlayer.updatedAt) {
          fixedPlayer.updatedAt = new Date().toISOString();
          needsFix = true;
        }
        
        if (needsFix) {
          fixedCount++;
          console.log(`🔧 Corrigindo jogador: ${fixedPlayer.name}`);
        }
        
        return fixedPlayer;
      });
      
      if (fixedCount > 0) {
        console.log(`🔧 Salvando ${fixedCount} jogadores corrigidos...`);
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(fixedPlayers));
        
        // Recarregar dados
        await loadLocalData();
        await reloadData();
        
        Alert.alert(
          'Jogadores Corrigidos!',
          `${fixedCount} jogadores foram corrigidos e agora têm todas as propriedades necessárias.`
        );
      } else {
        Alert.alert(
          'Nenhuma Correção Necessária',
          'Todos os jogadores já estão com a estrutura correta.'
        );
      }
      
      console.log('🔧 === CORREÇÃO CONCLUÍDA ===');
      
    } catch (error) {
      console.error('❌ Erro ao corrigir jogadores:', error);
      Alert.alert('Erro', 'Falha ao corrigir jogadores');
    }
  };

  // Função para verificação rápida de integridade dos dados
  const handleQuickCheck = async () => {
    try {
      console.log('🔍 === VERIFICAÇÃO RÁPIDA ===');
      
      // Verificar times
      const teamsData = await AsyncStorage.getItem('@GestaoTimes:teams');
      const teams = teamsData ? JSON.parse(teamsData) : [];
      console.log('🏆 Times no storage:', teams.length);
      
      // Verificar jogadores
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const players = playersData ? JSON.parse(playersData) : [];
      console.log('👥 Jogadores no storage:', players.length);
      
      // Verificar jogadores com times
      const playersWithTeams = players.filter((p: any) => p.teamId && p.teamId !== '');
      console.log('👥 Jogadores com times:', playersWithTeams.length);
      
      playersWithTeams.forEach((player: any, index: number) => {
        const team = teams.find((t: any) => t.id === player.teamId);
        console.log(`  ${index + 1}. ${player.name} → ${team ? team.name : 'TIME NÃO ENCONTRADO!'}`);
      });
      
      // Verificar times com jogadores
      teams.forEach((team: any, index: number) => {
        const teamPlayers = players.filter((p: any) => p.teamId === team.id);
        console.log(`🏆 Time ${index + 1}: ${team.name} (${teamPlayers.length} jogadores)`);
        teamPlayers.forEach((p: any, pIndex: number) => {
          console.log(`    ${pIndex + 1}. ${p.name} (${p.position})`);
        });
      });
      
      console.log('🔍 === FIM VERIFICAÇÃO RÁPIDA ===');
      
      Alert.alert(
        'Verificação Rápida',
        `Times: ${teams.length}\nJogadores: ${players.length}\nJogadores com times: ${playersWithTeams.length}\n\nVeja o console para detalhes.`
      );
      
    } catch (error) {
      console.error('❌ Erro na verificação rápida:', error);
      Alert.alert('Erro', 'Falha na verificação');
    }
  };

  // Função para forçar carregamento direto do AsyncStorage
  const handleForceLoadFromStorage = async () => {
    try {
      console.log('🔄 === FORÇANDO CARREGAMENTO DIRETO ===');
      
      // Carregar times diretamente do AsyncStorage
      const teamsData = await AsyncStorage.getItem('@GestaoTimes:teams');
      const storageTeams = teamsData ? JSON.parse(teamsData) : [];
      
      // Carregar jogadores diretamente do AsyncStorage
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const storagePlayers = playersData ? JSON.parse(playersData) : [];
      
      console.log('📊 Dados no AsyncStorage:');
      console.log('🏆 Times:', storageTeams.length);
      console.log('👥 Jogadores:', storagePlayers.length);
      
      console.log('📊 Dados no Contexto:');
      console.log('🏆 Times (contexto):', teams.length);
      console.log('👥 Jogadores (contexto):', players.length);
      
      // Mostrar diferenças
      if (storageTeams.length !== teams.length) {
        console.log('⚠️ DIFERENÇA: Times no storage ≠ times no contexto');
        console.log('🏆 Times no storage:', storageTeams.map((t: any) => t.name));
        console.log('🏆 Times no contexto:', teams.map((t: any) => t.name));
      }
      
      if (storagePlayers.length !== players.length) {
        console.log('⚠️ DIFERENÇA: Jogadores no storage ≠ jogadores no contexto');
        console.log('👥 Jogadores no storage:', storagePlayers.map((p: any) => p.name));
        console.log('👥 Jogadores no contexto:', players.map((p: any) => p.name));
      }
      
      // Filtrar times do professor atual
      const myStorageTeams = user?.userType === 'professor' 
        ? storageTeams.filter((t: any) => t.professorId === user?.id || !t.professorId) 
        : storageTeams;
      
      console.log('🏆 Meus times (storage):', myStorageTeams.length);
      console.log('🏆 Meus times (contexto):', myTeams.length);
      
      myStorageTeams.forEach((team: any, index: number) => {
        const teamPlayers = storagePlayers.filter((p: any) => p.teamId === team.id);
        console.log(`🏆 ${index + 1}. ${team.name} (${team.sport}) - ${teamPlayers.length} jogadores`);
        teamPlayers.forEach((p: any, pIndex: number) => {
          console.log(`    ${pIndex + 1}. ${p.name} (${p.position})`);
        });
      });
      
      console.log('🔄 === FIM CARREGAMENTO DIRETO ===');
      
      Alert.alert(
        'Carregamento Direto',
        `Storage: ${storageTeams.length} times, ${storagePlayers.length} jogadores\nContexto: ${teams.length} times, ${players.length} jogadores\nMeus times: ${myStorageTeams.length}\n\nVeja console para detalhes.`,
        [
          { text: 'OK' },
          { 
            text: 'Usar Storage', 
            onPress: () => {
              setLocalTeams(storageTeams);
              setLocalPlayers(storagePlayers);
              setUseLocalData(true);
              Alert.alert('Modo Local', 'Agora usando dados diretos do AsyncStorage!');
            }
          },
          { 
            text: 'Forçar Sync', 
            onPress: async () => {
              console.log('🔄 Forçando sincronização...');
              await reloadData();
              setUseLocalData(false);
              Alert.alert('Sincronização', 'Dados recarregados do contexto!');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Erro no carregamento direto:', error);
      Alert.alert('Erro', 'Falha no carregamento direto');
    }
  };

  // Função para encontrar Rafael especificamente
  const handleFindRafael = async () => {
    try {
      console.log('🔍 === PROCURANDO RAFAEL ESPECIFICAMENTE ===');
      
      // 1. Verificar no AsyncStorage
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      
      const storagePlayers = playersData ? JSON.parse(playersData) : [];
      const storageUsers = usersData ? JSON.parse(usersData) : [];
      
      console.log('📊 Total no storage:', {
        players: storagePlayers.length,
        users: storageUsers.length
      });
      
      // 2. Procurar Rafael em todas as variações
      const rafaelVariations = ['rafael', 'raphael', 'rafaell'];
      
      let rafaelPlayer = null;
      let rafaelUser = null;
      
      for (const variation of rafaelVariations) {
        rafaelPlayer = storagePlayers.find((p: any) => 
          p.name?.toLowerCase().includes(variation)
        );
        rafaelUser = storageUsers.find((u: any) => 
          u.name?.toLowerCase().includes(variation)
        );
        
        if (rafaelPlayer || rafaelUser) {
          console.log(`✅ Encontrado com variação: ${variation}`);
          break;
        }
      }
      
      console.log('🔍 Rafael Player:', rafaelPlayer ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      console.log('🔍 Rafael User:', rafaelUser ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (rafaelPlayer) {
        console.log('👥 Dados do Rafael (jogador):', rafaelPlayer);
      }
      
      if (rafaelUser) {
        console.log('👤 Dados do Rafael (usuário):', rafaelUser);
      }
      
      // 3. Listar TODOS os jogadores e usuários
      console.log('📋 TODOS OS JOGADORES:');
      storagePlayers.forEach((p: any, i: number) => {
        console.log(`${i+1}. ${p.name} (${p.sport}) - teamId: ${p.teamId || 'vazio'}`);
      });
      
      console.log('📋 TODOS OS USUÁRIOS:');
      storageUsers.forEach((u: any, i: number) => {
        console.log(`${i+1}. ${u.name} (${u.userType}) - sport: ${u.sport || 'sem esporte'}`);
      });
      
      // 4. Se Rafael usuário existe mas não tem jogador, criar
      if (rafaelUser && !rafaelPlayer && rafaelUser.userType === 'atleta') {
        console.log('🔧 Rafael é usuário atleta mas não tem jogador - criando...');
        
        const newRafaelPlayer = {
          id: `player-rafael-${Date.now()}`,
          name: rafaelUser.name,
          sport: rafaelUser.sport || 'futebol',
          position: rafaelUser.position || 'Atacante',
          teamId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: { goals: 0, assists: 0, games: 0, cards: 0 },
          profile: { age: 18 },
          feedbacks: [],
          atletaId: rafaelUser.id,
          atletaEmail: rafaelUser.email,
        };
        
        const updatedPlayers = [...storagePlayers, newRafaelPlayer];
        await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(updatedPlayers));
        
        console.log('✅ Jogador Rafael criado:', newRafaelPlayer);
        rafaelPlayer = newRafaelPlayer;
      }
      
      // 5. Forçar recarregamento
      await loadLocalData();
      await reloadData();
      
      // 6. Verificar se apareceu
      const currentRafael = currentPlayers.find((p: any) => 
        p.name?.toLowerCase().includes('rafael')
      );
      
      console.log('🔍 Rafael no contexto após reload:', currentRafael ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      // 7. Resultado
      let message = '';
      if (rafaelPlayer && currentRafael) {
        message = `✅ Rafael ENCONTRADO!\n\nNome: ${rafaelPlayer.name}\nEsporte: ${rafaelPlayer.sport}\nPosição: ${rafaelPlayer.position}\nTime: ${rafaelPlayer.teamId || 'Disponível'}\n\nRafael deve aparecer agora nos times!`;
      } else if (rafaelUser && !rafaelPlayer) {
        message = `⚠️ Rafael existe como usuário mas não como jogador.\n\nNome: ${rafaelUser.name}\nTipo: ${rafaelUser.userType}\nEsporte: ${rafaelUser.sport || 'não definido'}\n\nPrecisa criar jogador para ele.`;
      } else if (!rafaelUser && !rafaelPlayer) {
        message = `❌ Rafael NÃO ENCONTRADO.\n\nTotal de usuários: ${storageUsers.length}\nTotal de jogadores: ${storagePlayers.length}\n\nVerifique se o nome está correto ou se foi cadastrado.`;
      } else {
        message = `🔧 Situação complexa detectada.\n\nVeja o console para detalhes completos.`;
      }
      
      Alert.alert('Busca por Rafael', message);
      
      console.log('🔍 === FIM BUSCA RAFAEL ===');
      
    } catch (error) {
      console.error('❌ Erro ao procurar Rafael:', error);
      Alert.alert('Erro', 'Falha ao procurar Rafael');
    }
  };

  // Função para listar todos os emails de usuários
  const handleListAllEmails = async () => {
    try {
      console.log('📧 === LISTANDO TODOS OS EMAILS ===');
      
      // Carregar usuários do AsyncStorage
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      const users = usersData ? JSON.parse(usersData) : [];
      
      console.log('👤 Total de usuários cadastrados:', users.length);
      
      // Separar por tipo
      const professores = users.filter((u: any) => u.userType === 'professor');
      const atletas = users.filter((u: any) => u.userType === 'atleta');
      
      console.log('👨‍🏫 Professores:', professores.length);
      console.log('🏃‍♂️ Atletas:', atletas.length);
      
      // Listar professores
      console.log('\n📧 EMAILS DOS PROFESSORES:');
      const professoresEmails: string[] = [];
      professores.forEach((prof: any, index: number) => {
        const email = prof.email;
        const nome = prof.name;
        console.log(`${index + 1}. ${nome} - ${email}`);
        professoresEmails.push(`${nome} - ${email}`);
      });
      
      // Listar atletas
      console.log('\n📧 EMAILS DOS ATLETAS:');
      const atletasEmails: string[] = [];
      atletas.forEach((atleta: any, index: number) => {
        const email = atleta.email;
        const nome = atleta.name;
        const esporte = atleta.sport || 'sem esporte';
        const posicao = atleta.position || 'sem posição';
        console.log(`${index + 1}. ${nome} - ${email} (${esporte} - ${posicao})`);
        atletasEmails.push(`${nome} - ${email} (${esporte} - ${posicao})`);
      });
      
      console.log('📧 === FIM LISTAGEM DE EMAILS ===');
      
      // Preparar texto para o alert
      let alertText = `📊 USUÁRIOS CADASTRADOS:\n\n`;
      
      alertText += `👨‍🏫 PROFESSORES (${professores.length}):\n`;
      if (professores.length === 0) {
        alertText += `Nenhum professor cadastrado\n\n`;
      } else {
        professoresEmails.forEach((prof, i) => {
          alertText += `${i + 1}. ${prof}\n`;
        });
        alertText += `\n`;
      }
      
      alertText += `🏃‍♂️ ATLETAS (${atletas.length}):\n`;
      if (atletas.length === 0) {
        alertText += `Nenhum atleta cadastrado`;
      } else {
        atletasEmails.forEach((atleta, i) => {
          alertText += `${i + 1}. ${atleta}\n`;
        });
      }
      
      // Mostrar no alert (limitando o tamanho se necessário)
      if (alertText.length > 500) {
        alertText = alertText.substring(0, 500) + '...\n\nVeja console para lista completa';
      }
      
      Alert.alert('Emails Cadastrados', alertText);
      
      // Também retornar os dados para o chat
      return {
        professores: professoresEmails,
        atletas: atletasEmails,
        total: users.length
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar emails:', error);
      Alert.alert('Erro', 'Falha ao listar emails');
      return null;
    }
  };

  // Função para converter TODOS os atletas em jogadores
  const handleConvertAllAtletasToPlayers = async () => {
    try {
      console.log('🔄 === CONVERTENDO TODOS OS ATLETAS EM JOGADORES ===');
      
      // 1. Carregar dados
      const usersData = await AsyncStorage.getItem('@GestaoTimes:users');
      const playersData = await AsyncStorage.getItem('@GestaoTimes:players');
      
      const users = usersData ? JSON.parse(usersData) : [];
      const existingPlayers = playersData ? JSON.parse(playersData) : [];
      
      // 2. Filtrar apenas atletas
      const atletas = users.filter((u: any) => u.userType === 'atleta');
      
      console.log('📊 Dados encontrados:');
      console.log('👤 Total usuários:', users.length);
      console.log('🏃‍♂️ Total atletas:', atletas.length);
      console.log('👥 Jogadores existentes:', existingPlayers.length);
      
      if (atletas.length === 0) {
        Alert.alert('Nenhum Atleta', 'Não foram encontrados atletas cadastrados.');
        return;
      }
      
      // 3. Listar todos os atletas
      console.log('\n📋 ATLETAS ENCONTRADOS:');
      atletas.forEach((atleta: any, index: number) => {
        console.log(`${index + 1}. ${atleta.name} - ${atleta.email} (${atleta.sport || 'sem esporte'} - ${atleta.position || 'sem posição'})`);
      });
      
      // 4. Criar jogadores para TODOS os atletas
      const newPlayers = [...existingPlayers];
      let convertedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const atleta of atletas) {
        try {
          // Verificar se já existe jogador para este atleta
          const existingPlayer = newPlayers.find((p: any) => 
            p.name?.toLowerCase() === atleta.name?.toLowerCase() ||
            p.atletaId === atleta.id ||
            p.atletaEmail === atleta.email
          );
          
          if (existingPlayer) {
            console.log(`⚠️ Jogador já existe para ${atleta.name}, pulando...`);
            skippedCount++;
            continue;
          }
          
          // Validar dados mínimos
          if (!atleta.name || !atleta.email) {
            console.log(`❌ Dados insuficientes para ${atleta.name || 'atleta sem nome'}`);
            errorCount++;
            continue;
          }
          
          // Criar jogador
          const newPlayer = {
            id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: atleta.name,
            sport: atleta.sport || 'futebol', // Padrão se não tiver
            position: atleta.position || 'Jogador', // Padrão se não tiver
            teamId: '', // Disponível para seleção
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: {
              goals: 0,
              assists: 0,
              games: 0,
              cards: 0,
            },
            profile: {
              age: 18,
              height: undefined,
              weight: undefined,
              photo: undefined,
            },
            feedbacks: [],
            // Referências ao atleta original
            atletaId: atleta.id,
            atletaEmail: atleta.email,
            atletaProfessorId: atleta.professorId,
          };
          
          newPlayers.push(newPlayer);
          convertedCount++;
          
          console.log(`✅ Jogador criado: ${newPlayer.name} (${newPlayer.sport} - ${newPlayer.position})`);
          
        } catch (error) {
          console.error(`❌ Erro ao converter ${atleta.name}:`, error);
          errorCount++;
        }
      }
      
      // 5. Salvar todos os jogadores
      if (convertedCount > 0) {
        console.log(`\n💾 Salvando ${newPlayers.length} jogadores...`);
        
        // Múltiplas tentativas de salvamento
        let saveSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await AsyncStorage.setItem('@GestaoTimes:players', JSON.stringify(newPlayers));
            
            // Verificar salvamento
            const verification = await AsyncStorage.getItem('@GestaoTimes:players');
            const verifiedPlayers = verification ? JSON.parse(verification) : [];
            
            if (verifiedPlayers.length === newPlayers.length) {
              console.log(`✅ Salvamento verificado - ${verifiedPlayers.length} jogadores`);
              saveSuccess = true;
              break;
            }
          } catch (error) {
            console.error(`❌ Erro no salvamento tentativa ${attempt}:`, error);
          }
        }
        
        if (!saveSuccess) {
          throw new Error('Falha ao salvar jogadores após 3 tentativas');
        }
      }
      
      // 6. Recarregar dados
      console.log('🔄 Recarregando dados...');
      await loadLocalData();
      await reloadData();
      
      // 7. Verificar resultado
      const finalPlayersData = await AsyncStorage.getItem('@GestaoTimes:players');
      const finalPlayers = finalPlayersData ? JSON.parse(finalPlayersData) : [];
      
      console.log('🔄 === CONVERSÃO CONCLUÍDA ===');
      console.log(`✅ Convertidos: ${convertedCount}`);
      console.log(`⚠️ Já existiam: ${skippedCount}`);
      console.log(`❌ Erros: ${errorCount}`);
      console.log(`📊 Total jogadores final: ${finalPlayers.length}`);
      
      Alert.alert(
        'Conversão Concluída!',
        `✅ ${convertedCount} atletas convertidos em jogadores\n⚠️ ${skippedCount} já eram jogadores\n❌ ${errorCount} erros\n\n📊 Total de jogadores: ${finalPlayers.length}\n\nAgora todos os atletas devem aparecer na seleção de times e na aba jogadores!`,
        [
          { text: 'OK' },
          { 
            text: 'Verificar', 
            onPress: () => handleQuickCheck()
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Erro na conversão:', error);
      Alert.alert('Erro', `Falha na conversão: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Meus Times</Text>
          {useLocalData && (
            <View style={styles.localDataIndicator}>
              <Ionicons name="warning" size={16} color="#FF9800" />
              <Text style={styles.localDataText}>Local</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowTeamModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {myTeams.map((team) => {
          const teamPlayers = getTeamPlayers(team.id);
          return (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={[styles.sportIcon, { backgroundColor: getSportColor(team.sport) }]}>
                  <Ionicons name={getSportIcon(team.sport) as any} size={20} color="#fff" />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamTitle}>{team.name}</Text>
                  <Text style={styles.teamSport}>{team.sport}</Text>
                </View>
                <Text style={styles.playerCount}>{teamPlayers.length} jogadores</Text>
              </View>

              <TouchableOpacity 
                style={styles.addPlayerButton}
                onPress={() => handleOpenPlayerModal(team)}
              >
                <Ionicons name="person-add" size={16} color="#0066FF" />
                <Text style={styles.addPlayerText}>Adicionar Jogador</Text>
              </TouchableOpacity>

              {teamPlayers.map((player) => (
                <View key={player.id} style={styles.playerRow}>
                  <TouchableOpacity 
                    style={styles.playerInfo}
                    onPress={() => abrirFeedback(player)}
                  >
                    <Ionicons name="person" size={16} color="#666" />
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPosition}>({player.position})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleRemovePlayerFromTeam(player)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="remove-circle" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))}

              {teamPlayers.length === 0 && (
                <Text style={styles.noPlayersText}>Nenhum jogador no time</Text>
              )}
            </View>
          );
        })}

        {myTeams.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum time criado ainda</Text>
            
            <TouchableOpacity 
              style={styles.createFirstTeamButton}
              onPress={() => setShowTeamModal(true)}
            >
              <Text style={styles.createFirstTeamText}>Criar Primeiro Time</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal de Adicionar Jogador */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Jogador ao {selectedTeam?.name}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {availablePlayers.length > 0 ? (
            <FlatList
              data={availablePlayers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playerItem}
                  onPress={() => handleAddPlayerToTeam(item)}
                >
                  <View style={styles.playerItemInfo}>
                    <Text style={styles.playerItemName}>{item.name}</Text>
                    <Text style={styles.playerItemPosition}>{item.position}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.noPlayersAvailable}>
              <Ionicons name="person-add-outline" size={60} color="#ccc" />
              <Text style={styles.noPlayersAvailableText}>
                Nenhum jogador de {selectedTeam?.sport} disponível
              </Text>
              <Text style={styles.noPlayersAvailableSubtext}>
                Crie atletas na tela de cadastro primeiro
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal de Feedback */}
      <Modal visible={feedbackModal} animationType="fade" transparent>
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackModal}>
            <Text style={styles.feedbackTitle}>Feedback para {selectedPlayer?.name}</Text>
            <ScrollView style={styles.feedbackList}>
              {(feedbackPorEsporte[selectedPlayer?.sport?.toLowerCase() || "generico"] || []).map((frase, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.feedbackItem}
                  onPress={() => enviarFeedback(frase)}
                >
                  <Text style={styles.feedbackText}>• {frase}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setFeedbackModal(false)} 
              style={styles.closeFeedbackButton}
            >
              <Text style={styles.closeFeedbackText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AddTeamModal 
        visible={showTeamModal} 
        onClose={() => {
          setShowTeamModal(false);
          reloadData(); // Recarregar após criar time
        }} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  localDataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  localDataText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
      addButton: {
      backgroundColor: '#0066FF',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  teamCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    marginBottom: 12, 
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
  },
  teamSport: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  playerCount: {
    fontSize: 12,
    color: '#666',
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  addPlayerText: { 
    color: '#0066FF', 
    marginLeft: 8,
    fontWeight: '500',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerName: { 
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  playerPosition: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  noPlayersText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },

  createFirstTeamButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstTeamText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    flex: 1,
  },
  playerItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  playerItemPosition: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noPlayersAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noPlayersAvailableText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
  noPlayersAvailableSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  feedbackList: {
    maxHeight: 300,
  },
  feedbackItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedbackText: {
    fontSize: 14,
    color: '#333',
  },
  closeFeedbackButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeFeedbackText: {
    fontSize: 16,
    color: '#333',
  },

}); 