import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { AppThemeProvider } from '../components/AppThemeProvider';
import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { useRouter, useSegments } from 'expo-router';

// Mantém a tela de splash visível enquanto carregamos os recursos
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    console.log('Navegação - Usuário:', user?.userType, 'Segmentos:', segments);

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(atleta)' || segments[0] === '(professor)';
    const inAuthPages = ['login', 'cadastro', 'esqueceuSenha'].includes(segments[0]);

    if (!user && !inAuthPages) {
      // Usuário não logado, redirecionar para login
      console.log('Redirecionando para login - usuário não logado');
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // Usuário logado, redirecionar baseado no tipo
      console.log('Redirecionando baseado no tipo de usuário:', user.userType);
      if (user.userType === 'professor') {
        router.replace('/(tabs)');
      } else if (user.userType === 'atleta') {
        router.replace('/(atleta)');
      }
    } else if (user && inAuthGroup) {
      // Verificar se está na área correta
      const isInCorrectArea = 
        (user.userType === 'professor' && segments[0] === '(tabs)') ||
        (user.userType === 'atleta' && segments[0] === '(atleta)');
      
      if (!isInCorrectArea) {
        console.log('Usuário na área incorreta, redirecionando...');
        if (user.userType === 'professor') {
          router.replace('/(tabs)');
        } else if (user.userType === 'atleta') {
          router.replace('/(atleta)');
        }
      }
    }
  }, [user, segments, authLoading]);

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="cadastroProfissional" />
      <Stack.Screen name="esqueceuSenha" />
      <Stack.Screen name="editarPerfil" />
      <Stack.Screen name="perfilEsporte" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(atleta)" />
      <Stack.Screen name="(professor)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({});
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Simular carregamento de recursos
        await new Promise(resolve => setTimeout(resolve, 1000));
        await SplashScreen.hideAsync();
        setIsReady(true);
      } catch (e) {
        setError(e as Error);
        console.warn('Erro ao carregar recursos:', e);
      }
    }

    if (loaded) {
      prepare();
    }
  }, [loaded]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ocorreu um erro ao carregar o aplicativo</Text>
        <Text style={styles.errorDetails}>{error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
   <ThemeProvider value={colorScheme.isDark ? DarkTheme : DefaultTheme}>
  <AppThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        <AppDataProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AppDataProvider>
      </NotificationProvider>
    </AuthProvider>
  </AppThemeProvider>
</ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
}); 