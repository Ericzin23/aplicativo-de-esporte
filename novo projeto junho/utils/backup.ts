import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { printToFileAsync } from 'expo-print';

import { StorageKeys, getItem } from './storage';

interface BackupOptions {
  user: any;
}

export async function createBackupZip({ user }: BackupOptions): Promise<string> {
  const zip = new JSZip();

  // Perfil
  zip.file('perfil.json', JSON.stringify(user, null, 2));

  // Estatísticas simples CSV
  const teams = (await getItem<any[]>(StorageKeys.TEAMS)) || [];
  const players = (await getItem<any[]>(StorageKeys.PLAYERS)) || [];
  const events = (await getItem<any[]>(StorageKeys.EVENTS)) || [];

  const csvLines = [
    'tipo,quantidade',
    `times,${teams.length}`,
    `jogadores,${players.length}`,
    `eventos,${events.length}`,
  ];
  zip.file('estatisticas.csv', csvLines.join('\n'));

  // Orientações - usar eventos de treino como exemplo
  const orientacoes = events.filter(e => e.type === 'treino');
  zip.file('orientacoes.json', JSON.stringify(orientacoes, null, 2));

  // Agenda em ICS
  const icsEvents = events
    .map(e => {
      const start = e.date.replace(/-/g, '');
      return [
        'BEGIN:VEVENT',
        `UID:${e.id}`,
        `DTSTART;VALUE=DATE:${start}`,
        `SUMMARY:${e.title}`,
        `DESCRIPTION:${e.description || ''}`,
        'END:VEVENT',
      ].join('\n');
    })
    .join('\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', icsEvents, 'END:VCALENDAR'].join('\n');
  zip.file('agenda.ics', ics);

  // Relatório PDF básico
  const pdf = await printToFileAsync({ html: '<h1>Relatórios</h1>' });
  const pdfData = await FileSystem.readAsStringAsync(pdf.uri, { encoding: FileSystem.EncodingType.Base64 });
  zip.file('relatorios.pdf', pdfData, { base64: true });

  const content = await zip.generateAsync({ type: 'base64' });
  const fileUri = FileSystem.cacheDirectory + 'backup.zip';
  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.Base64 });

  if (Sharing.isAvailableAsync && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(fileUri);
  }

  return fileUri;
}
