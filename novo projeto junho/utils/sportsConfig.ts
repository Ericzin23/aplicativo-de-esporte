export interface SportConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  positions: string[];
  statistics: {
    key: string;
    label: string;
    icon: string;
    color: string;
  }[];
  orientationTypes: {
    key: string;
    label: string;
    icon: string;
    examples: string[];
  }[];
  eventTypes: {
    key: string;
    label: string;
    icon: string;
  }[];
}

export const SPORTS_CONFIG: Record<string, SportConfig> = {
  futebol: {
    id: 'futebol',
    name: 'Futebol',
    icon: 'football',
    color: '#4CAF50',
    positions: ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'],
    statistics: [
      { key: 'gols', label: 'Gols', icon: 'football', color: '#4CAF50' },
      { key: 'assistencias', label: 'Assistências', icon: 'hand-right', color: '#2196F3' },
      { key: 'jogos', label: 'Jogos', icon: 'trophy', color: '#FF9800' },
      { key: 'cartoes', label: 'Cartões', icon: 'card', color: '#F44336' },
      { key: 'defesas', label: 'Defesas', icon: 'shield', color: '#9C27B0' },
      { key: 'faltas', label: 'Faltas', icon: 'warning', color: '#FF5722' }
    ],
    orientationTypes: [
      {
        key: 'tecnica',
        label: 'Técnica',
        icon: 'football',
        examples: ['Melhore sua finalização', 'Trabalhe o passe', 'Pratique dribles']
      },
      {
        key: 'tatica',
        label: 'Tática',
        icon: 'map',
        examples: ['Posicionamento em campo', 'Marcação', 'Movimentação sem bola']
      },
      {
        key: 'fisica',
        label: 'Física',
        icon: 'fitness',
        examples: ['Resistência', 'Velocidade', 'Força']
      }
    ],
    eventTypes: [
      { key: 'treino', label: 'Treino', icon: 'fitness' },
      { key: 'jogo', label: 'Jogo', icon: 'football' },
      { key: 'amistoso', label: 'Amistoso', icon: 'people' }
    ]
  },
  volei: {
    id: 'volei',
    name: 'Vôlei',
    icon: 'basketball',
    color: '#FF9800',
    positions: ['Levantador', 'Oposto', 'Central', 'Ponteiro', 'Líbero'],
    statistics: [
      { key: 'pontos', label: 'Pontos', icon: 'trophy', color: '#4CAF50' },
      { key: 'aces', label: 'Aces', icon: 'flash', color: '#2196F3' },
      { key: 'bloqueios', label: 'Bloqueios', icon: 'hand-left', color: '#FF9800' },
      { key: 'sets', label: 'Sets', icon: 'layers', color: '#9C27B0' },
      { key: 'recepcoes', label: 'Recepções', icon: 'arrow-down', color: '#607D8B' },
      { key: 'ataques', label: 'Ataques', icon: 'arrow-up', color: '#F44336' }
    ],
    orientationTypes: [
      {
        key: 'saque',
        label: 'Saque',
        icon: 'flash',
        examples: ['Melhore a precisão do saque', 'Varie os tipos de saque', 'Trabalhe a potência']
      },
      {
        key: 'recepcao',
        label: 'Recepção',
        icon: 'arrow-down',
        examples: ['Posicionamento na recepção', 'Passe para levantador', 'Leitura do saque']
      },
      {
        key: 'ataque',
        label: 'Ataque',
        icon: 'arrow-up',
        examples: ['Tempo de ataque', 'Variação de golpes', 'Leitura do bloqueio']
      }
    ],
    eventTypes: [
      { key: 'treino', label: 'Treino', icon: 'fitness' },
      { key: 'jogo', label: 'Jogo', icon: 'basketball' },
      { key: 'torneio', label: 'Torneio', icon: 'trophy' }
    ]
  },
  basquete: {
    id: 'basquete',
    name: 'Basquete',
    icon: 'basketball',
    color: '#FF5722',
    positions: ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'],
    statistics: [
      { key: 'pontos', label: 'Pontos', icon: 'basketball', color: '#4CAF50' },
      { key: 'rebotes', label: 'Rebotes', icon: 'repeat', color: '#2196F3' },
      { key: 'assistencias', label: 'Assistências', icon: 'hand-right', color: '#FF9800' },
      { key: 'jogos', label: 'Jogos', icon: 'trophy', color: '#9C27B0' },
      { key: 'roubadas', label: 'Roubadas', icon: 'eye', color: '#607D8B' },
      { key: 'bloqueios', label: 'Bloqueios', icon: 'hand-left', color: '#F44336' }
    ],
    orientationTypes: [
      {
        key: 'arremesso',
        label: 'Arremesso',
        icon: 'basketball',
        examples: ['Melhore a precisão', 'Trabalhe arremessos de 3', 'Lance livre']
      },
      {
        key: 'drible',
        label: 'Drible',
        icon: 'repeat',
        examples: ['Controle de bola', 'Mudança de direção', 'Proteção da bola']
      },
      {
        key: 'defesa',
        label: 'Defesa',
        icon: 'shield',
        examples: ['Posicionamento defensivo', 'Rebote defensivo', 'Marcação individual']
      }
    ],
    eventTypes: [
      { key: 'treino', label: 'Treino', icon: 'fitness' },
      { key: 'jogo', label: 'Jogo', icon: 'basketball' },
      { key: 'campeonato', label: 'Campeonato', icon: 'trophy' }
    ]
  },
  futsal: {
    id: 'futsal',
    name: 'Futsal',
    icon: 'football',
    color: '#2196F3',
    positions: ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
    statistics: [
      { key: 'gols', label: 'Gols', icon: 'football', color: '#4CAF50' },
      { key: 'assistencias', label: 'Assistências', icon: 'hand-right', color: '#2196F3' },
      { key: 'jogos', label: 'Jogos', icon: 'trophy', color: '#FF9800' },
      { key: 'cartoes', label: 'Cartões', icon: 'card', color: '#F44336' },
      { key: 'defesas', label: 'Defesas', icon: 'shield', color: '#9C27B0' },
      { key: 'finalizacoes', label: 'Finalizações', icon: 'target', color: '#607D8B' }
    ],
    orientationTypes: [
      {
        key: 'controle',
        label: 'Controle',
        icon: 'football',
        examples: ['Primeiro toque', 'Domínio orientado', 'Controle em espaço reduzido']
      },
      {
        key: 'passe',
        label: 'Passe',
        icon: 'arrow-forward',
        examples: ['Passe curto', 'Lançamento', 'Passe de primeira']
      },
      {
        key: 'finalizacao',
        label: 'Finalização',
        icon: 'target',
        examples: ['Chute no gol', 'Precisão', 'Chute de primeira']
      }
    ],
    eventTypes: [
      { key: 'treino', label: 'Treino', icon: 'fitness' },
      { key: 'jogo', label: 'Jogo', icon: 'football' },
      { key: 'copa', label: 'Copa', icon: 'trophy' }
    ]
  },
  handebol: {
    id: 'handebol',
    name: 'Handebol',
    icon: 'basketball',
    color: '#9C27B0',
    positions: ['Goleiro', 'Armador Central', 'Armador Lateral', 'Ponta', 'Pivô'],
    statistics: [
      { key: 'gols', label: 'Gols', icon: 'basketball', color: '#4CAF50' },
      { key: 'assistencias', label: 'Assistências', icon: 'hand-right', color: '#2196F3' },
      { key: 'jogos', label: 'Jogos', icon: 'trophy', color: '#FF9800' },
      { key: 'defesas', label: 'Defesas', icon: 'shield', color: '#9C27B0' },
      { key: 'roubadas', label: 'Roubadas', icon: 'eye', color: '#607D8B' },
      { key: 'exclusoes', label: 'Exclusões', icon: 'warning', color: '#F44336' }
    ],
    orientationTypes: [
      {
        key: 'arremesso',
        label: 'Arremesso',
        icon: 'basketball',
        examples: ['Precisão no arremesso', 'Potência', 'Variação de ângulos']
      },
      {
        key: 'passe',
        label: 'Passe',
        icon: 'hand-right',
        examples: ['Passe em movimento', 'Assistência', 'Passe de ombro']
      },
      {
        key: 'defesa',
        label: 'Defesa',
        icon: 'shield',
        examples: ['Marcação individual', 'Interceptação', 'Posicionamento']
      }
    ],
    eventTypes: [
      { key: 'treino', label: 'Treino', icon: 'fitness' },
      { key: 'jogo', label: 'Jogo', icon: 'basketball' },
      { key: 'torneio', label: 'Torneio', icon: 'trophy' }
    ]
  }
};

export function getSportConfig(sportId: string): SportConfig | null {
  return SPORTS_CONFIG[sportId] || null;
}

export function getSportStatistics(sportId: string) {
  const config = getSportConfig(sportId);
  return config?.statistics || [];
}

export function getSportPositions(sportId: string) {
  const config = getSportConfig(sportId);
  return config?.positions || [];
}

export function getSportOrientationTypes(sportId: string) {
  const config = getSportConfig(sportId);
  return config?.orientationTypes || [];
}

export function getSportEventTypes(sportId: string) {
  const config = getSportConfig(sportId);
  return config?.eventTypes || [];
} 