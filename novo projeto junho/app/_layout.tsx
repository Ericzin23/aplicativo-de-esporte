import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { useRouter, useSegments } from 'expo-router';

// Mantém a tela de splash visível enquanto carregamos os recursos
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(atleta)';
    const inAuthPages = ['login', 'cadastro'].includes(segments[0]);

    if (!user && !inAuthPages) {
      // Usuário não logado, redirecionar para login
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // Usuário logado, redirecionar baseado no tipo
      if (user.userType === 'professor') {
        router.replace('/(tabs)');
      } else if (user.userType === 'atleta') {
        router.replace('/(atleta)');
      }
    }
  }, [user, segments, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="cadastro" />
      <Stack.Screen name="editarPerfil" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(atleta)" />
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
      <AuthProvider>
        <AppDataProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 