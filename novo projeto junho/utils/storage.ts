import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  USUARIOS: '@GestaoTimes:usuarios',
  USER: '@GestaoTimes:user',
  DADOS_CADASTRO: '@GestaoTimes:dadosCadastro',
  DADOS_PROFISSIONAIS: '@GestaoTimes:dadosProfissionais',
  FOTO_PERFIL: '@GestaoTimes:fotoPerfil',
  CONFIGURACOES: '@GestaoTimes:configuracoes',
  TEAMS: '@GestaoTimes:teams',
  PLAYERS: '@GestaoTimes:players',
  EVENTS: '@GestaoTimes:events',
} as const;

export const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Erro ao salvar no storage:', error);
    throw error;
  }
};

export const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erro ao ler do storage:', error);
    return null;
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erro ao remover do storage:', error);
    throw error;
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
    throw error;
  }
}; 