import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from 'jszip';
import { StorageKeys } from './storage';

export async function createBackupZip(): Promise<string> {
  const zip = new JSZip();

  const user = await AsyncStorage.getItem(StorageKeys.USER);
  const cadastro = await AsyncStorage.getItem(StorageKeys.DADOS_CADASTRO);
  const profissionais = await AsyncStorage.getItem(StorageKeys.DADOS_PROFISSIONAIS);

  zip.file('perfil.json', JSON.stringify({ user: user ? JSON.parse(user) : null, cadastro: cadastro ? JSON.parse(cadastro) : null, profissionais: profissionais ? JSON.parse(profissionais) : null }, null, 2));

  const playersRaw = await AsyncStorage.getItem(StorageKeys.PLAYERS);
  const players = playersRaw ? JSON.parse(playersRaw) : [];
  let csv = 'Nome,Posicao,Gols,Assistencias\n';
  players.forEach((p: any) => {
    csv += `${p.name},${p.position},${p.goals},${p.assists}\n`;
  });
  zip.file('estatisticas.csv', csv);

  const eventsRaw = await AsyncStorage.getItem(StorageKeys.EVENTS);
  const events = eventsRaw ? JSON.parse(eventsRaw) : [];
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
  events.forEach((e: any) => {
    ics += `BEGIN:VEVENT\nSUMMARY:${e.title}\nDTSTART:${e.date.replace(/-/g, '')}T${e.time.replace(':', '')}00\nEND:VEVENT\n`;
  });
  ics += 'END:VCALENDAR';
  zip.file('agenda.ics', ics);

  zip.file('orientacoes.json', '[]');
  zip.file('relatorios.pdf', '');

  const base64 = await zip.generateAsync({ type: 'base64' });
  const path = `${FileSystem.cacheDirectory}backup.zip`;
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
  return path;
}
