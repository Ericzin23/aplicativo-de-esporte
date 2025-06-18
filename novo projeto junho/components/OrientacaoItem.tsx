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
  professorId?: string;
  professorName?: string;
  jogadorId?: string;
  jogadorName?: string;
  esporte?: string;
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
    case 'feedback':
      return 'chatbubble-ellipses';
    default:
      return 'chatbubble';
  }
}

function getIconColor(tipo: string) {
  switch (tipo) {
    case 'treino':
      return '#4CAF50';
    case 'alimentacao':
      return '#FF9800';
    case 'recuperacao':
      return '#2196F3';
    case 'feedback':
      return '#9C27B0';
    default:
      return '#4CAF50';
  }
}

export default function OrientacaoItem({ orientacao, highlight, onMarkAsRead }: OrientacaoItemProps) {
  const icon = getIconName(orientacao.tipo);
  const iconColor = getIconColor(orientacao.tipo);
  return (
    <View style={[styles.container, highlight && styles.highlight]}>
      <View style={styles.row}>
        <Ionicons name={icon as any} size={24} color={iconColor} style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{orientacao.titulo}</Text>
          <View style={styles.metaInfo}>
            <Text style={styles.data}>{new Date(orientacao.data).toLocaleDateString('pt-BR')}</Text>
            {orientacao.tipo === 'feedback' && orientacao.professorName && (
              <Text style={styles.professor}>• {orientacao.professorName}</Text>
            )}
            {orientacao.esporte && (
              <Text style={styles.esporte}>• {orientacao.esporte}</Text>
            )}
          </View>
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
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  data: {
    fontSize: 12,
    color: '#666',
  },
  professor: {
    fontSize: 12,
    color: '#9C27B0',
    fontWeight: '500',
    marginLeft: 4,
  },
  esporte: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
