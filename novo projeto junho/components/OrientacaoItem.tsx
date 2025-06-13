import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Orientacao {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
}

interface OrientacaoItemProps {
  orientacao: Orientacao;
  highlight?: boolean;
  onMarkAsRead?: (id: string) => void;
}

function getIconName(tipo: string) {
  switch (tipo) {
    case 'treino':
      return 'basketball';
    case 'alimentacao':
      return 'nutrition';
    case 'recuperacao':
      return 'fitness';
    default:
      return 'chatbubble';
  }
}

export default function OrientacaoItem({ orientacao, highlight, onMarkAsRead }: OrientacaoItemProps) {
  const icon = getIconName(orientacao.tipo);
  return (
    <View style={[styles.container, highlight && styles.highlight]}>
      <View style={styles.row}>
        <Ionicons name={icon as any} size={24} color="#4CAF50" style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{orientacao.titulo}</Text>
          <Text style={styles.data}>{new Date(orientacao.data).toLocaleDateString('pt-BR')}</Text>
        </View>
        {!orientacao.lida && onMarkAsRead && (
          <TouchableOpacity onPress={() => onMarkAsRead(orientacao.id)} style={styles.markButton}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.descricao} numberOfLines={highlight ? 3 : 2}>
        {orientacao.descricao}
      </Text>
      {orientacao.lida && <Text style={styles.lida}>Lida</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  highlight: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  data: {
    fontSize: 12,
    color: '#666',
  },
  descricao: {
    fontSize: 14,
    color: '#666',
  },
  markButton: {
    backgroundColor: '#4CAF50',
    padding: 6,
    borderRadius: 12,
  },
  lida: {
    marginTop: 4,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
