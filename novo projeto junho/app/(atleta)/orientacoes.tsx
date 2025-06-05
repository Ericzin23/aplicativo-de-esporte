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
import { getSportConfig, getSportGuidance } from '../../utils/sportsConfig';

interface Orientacao {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data: string;
  status: 'pendente' | 'concluida';
}

export default function OrientacoesAtleta() {
  const { user } = useAuth();
  const [orientacoes, setOrientacoes] = useState<Orientacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrientacoes();
  }, []);

  async function loadOrientacoes() {
    try {
      setLoading(true);
      const storedGuidance = await AsyncStorage.getItem(`@GestaoTimes:guidance_${user?.id}`);
      
      if (storedGuidance) {
        const guidance = JSON.parse(storedGuidance);
        
        // Verificar se as orientações são válidas para o esporte
        const sportConfig = getSportConfig(user?.sport || 'futebol');
        const validGuidanceTypes = sportConfig?.guidanceTypes || [];
        
        const validGuidance = guidance.filter((g: Orientacao) => 
          validGuidanceTypes.includes(g.tipo)
        );
        
        setOrientacoes(validGuidance);
      } else {
        setOrientacoes([]);
      }
    } catch (error) {
      console.log('Erro ao carregar orientações:', error);
      setOrientacoes([]);
    } finally {
      setLoading(false);
    }
  }

  const getGuidanceIcon = (tipo: string) => {
    switch (tipo) {
      case 'treino':
        return 'fitness';
      case 'tatica':
        return 'grid';
      case 'fisico':
        return 'barbell';
      case 'nutricao':
        return 'nutrition';
      case 'recuperacao':
        return 'medkit';
      default:
        return 'help-circle';
    }
  };

  const getGuidanceColor = (tipo: string) => {
    switch (tipo) {
      case 'treino':
        return '#4CAF50';
      case 'tatica':
        return '#2196F3';
      case 'fisico':
        return '#FF9800';
      case 'nutricao':
        return '#E91E63';
      case 'recuperacao':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Orientações</Text>
          <Text style={styles.subtitle}>
            {user?.sport ? `Orientações para ${user.sport}` : 'Orientações'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando orientações...</Text>
          </View>
        ) : orientacoes.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="document-text-outline" size={48} color="#757575" />
            <Text style={styles.noDataText}>
              Aguardando orientações do professor
            </Text>
          </View>
        ) : (
          orientacoes.map((orientacao) => (
            <View key={orientacao.id} style={styles.orientacaoCard}>
              <View style={styles.orientacaoHeader}>
                <View style={styles.orientacaoIconContainer}>
                  <Ionicons
                    name={getGuidanceIcon(orientacao.tipo)}
                    size={24}
                    color={getGuidanceColor(orientacao.tipo)}
                  />
                </View>
                <View style={styles.orientacaoInfo}>
                  <Text style={styles.orientacaoTitulo}>{orientacao.titulo}</Text>
                  <Text style={styles.orientacaoData}>{orientacao.data}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        orientacao.status === 'concluida'
                          ? '#4CAF50'
                          : '#FFC107',
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {orientacao.status === 'concluida'
                      ? 'Concluída'
                      : 'Pendente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.orientacaoDescricao}>
                {orientacao.descricao}
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
  orientacaoCard: {
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
  orientacaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orientacaoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orientacaoInfo: {
    flex: 1,
  },
  orientacaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orientacaoData: {
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
  orientacaoDescricao: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 