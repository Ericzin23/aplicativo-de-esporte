import * as FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { printToFileAsync } from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys, getItem } from './storage';

interface BackupOptions {
  user?: any;
}

export async function createBackupZip({ user }: BackupOptions = {}): Promise<string> {
  const zip = new JSZip();

  // Recuperar user do AsyncStorage se não for passado
  if (!user) {
    const raw = await AsyncStorage.getItem(StorageKeys.USER);
    user = raw ? JSON.parse(raw) : null;
  }

  // Perfil
  const cadastroRaw = await AsyncStorage.getItem(StorageKeys.DADOS_CADASTRO);
  const profissionaisRaw = await AsyncStorage.getItem(StorageKeys.DADOS_PROFISSIONAIS);

  zip.file(
    'perfil.json',
    JSON.stringify(
      {
        user,
        cadastro: cadastroRaw ? JSON.parse(cadastroRaw) : null,
        profissionais: profissionaisRaw ? JSON.parse(profissionaisRaw) : null,
      },
      null,
      2
    )
  );

  // Estatísticas em CSV
  const players = (await getItem<any[]>(StorageKeys.PLAYERS)) || [];
  let csv = 'Nome,Posicao,Gols,Assistencias\n';
  players.forEach((p: any) => {
    csv += `${p.name},${p.position},${p.goals || 0},${p.assists || 0}\n`;
  });
  zip.file('estatisticas.csv', csv);

  // Eventos
  const events = (await getItem<any[]>(StorageKeys.EVENTS)) || [];

  // Orientações
  const orientacoes = events.filter(e => e.type === 'treino');
  zip.file('orientacoes.json', JSON.stringify(orientacoes, null, 2));

  // Agenda em ICS
  const icsEvents = events
    .map(e => {
      const start = e.date.replace(/-/g, '');
      const time = e.time?.replace(':', '') || '0000';
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${e.title}`,
        `DTSTART:${start}T${time}00`,
        'END:VEVENT',
      ].join('\n');
    })
    .join('\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', icsEvents, 'END:VCALENDAR'].join('\n');
  zip.file('agenda.ics', ics);

  // PDF básico
  const pdf = await printToFileAsync({ html: '<h1>Relatórios</h1>' });
  const pdfData = await FileSystem.readAsStringAsync(pdf.uri, { encoding: FileSystem.EncodingType.Base64 });
  zip.file('relatorios.pdf', pdfData, { base64: true });

  // Geração final
  const content = await zip.generateAsync({ type: 'base64' });
  const fileUri = FileSystem.cacheDirectory + 'backup.zip';
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.Base64 });

  // Compartilhar se possível
  if (Sharing.isAvailableAsync && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(fileUri);
  }

  return fileUri;
}
