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

import OrientacaoItem, { Orientacao } from '../../components/OrientacaoItem';


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
      const storedData = await AsyncStorage.getItem(`@GestaoTimes:orientacoes_${user?.id}`);

      const list: Orientacao[] = storedData ? JSON.parse(storedData) : [];
      const ordered = list.sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      setOrientacoes(ordered);
    } catch (error) {
      console.log('Erro ao carregar orientações:', error);
      setOrientacoes([]);
    } finally {
      setLoading(false);
    }
  }

  const marcarOrientacaoLida = async (id: string) => {
    const novas = orientacoes.map(o => (o.id === id ? { ...o, lida: true } : o));
    setOrientacoes(novas);

    try {
      await AsyncStorage.setItem(
        `@GestaoTimes:orientacoes_${user?.id}`,
        JSON.stringify(novas)
      );
    } catch (error) {
      console.log('Erro ao atualizar orientação:', error);
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
            <OrientacaoItem
              key={orientacao.id}
              orientacao={orientacao}
              onMarkAsRead={marcarOrientacaoLida}
            />
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
}); 