import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function AtletaLayout() {
  const { user } = useAuth();
  const { badges } = useNotifications();

  useEffect(() => {
    console.log('🏃‍♂️ AtletaLayout - Verificando usuário:', {
      exists: !!user,
      userType: user?.userType,
      email: user?.email
    });
  }, [user]);

  // Redirecionar se não estiver logado
  if (!user) {
    console.log('🏃‍♂️ AtletaLayout - Redirecionando para login (usuário não encontrado)');
    return <Redirect href="/login" />;
  }

  // Redirecionar se não for atleta
  if (user.userType !== 'atleta') {
    console.log('🏃‍♂️ AtletaLayout - Redirecionando para tabs (usuário não é atleta):', user.userType);
    return <Redirect href="/(tabs)" />;
  }

  console.log('🏃‍♂️ AtletaLayout - Usuário atleta confirmado, renderizando layout');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: 'Meu Desempenho',
        }}
      />
      <Tabs.Screen
        name="estatisticas"
        options={{
          title: 'Estatísticas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
          tabBarBadge: badges.stats ? '' : undefined,
          headerTitle: 'Minhas Estatísticas',
        }}
      />
      <Tabs.Screen
        name="orientacoes"
        options={{
          title: 'Orientações',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
          tabBarBadge: badges.guidance ? '' : undefined,
          headerTitle: 'Orientações do Professor',
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          tabBarBadge: badges.events ? '' : undefined,
          headerTitle: 'Minha Agenda',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Meu Perfil',
        }}
      />
    </Tabs>
  );
} 