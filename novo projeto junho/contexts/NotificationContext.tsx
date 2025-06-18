import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  badges: {
    events: boolean;
    stats: boolean;
    guidance: boolean;
  };
  notifyEvent: (title: string, body: string) => Promise<void>;
  notifyStats: (title: string, body: string) => Promise<void>;
  notifyGuidance: (title: string, body: string) => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  clearBadge: (type: 'events' | 'stats' | 'guidance') => void;
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [badges, setBadges] = useState({ events: false, stats: false, guidance: false });

  useEffect(() => {
    registerForPushNotifications();
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const stored = await AsyncStorage.getItem('@GestaoTimes:badges');
    if (stored) {
      setBadges(JSON.parse(stored));
    }
  };

  const saveBadges = async (newBadges: typeof badges) => {
    setBadges(newBadges);
    await AsyncStorage.setItem('@GestaoTimes:badges', JSON.stringify(newBadges));
  };

  const schedulePush = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  };

  const notifyEvent = async (title: string, body: string) => {
    await schedulePush(title, body);
    await saveBadges({ ...badges, events: true });
  };

  const notifyStats = async (title: string, body: string) => {
    await schedulePush(title, body);
    await saveBadges({ ...badges, stats: true });
  };

  const notifyGuidance = async (title: string, body: string) => {
    await schedulePush(title, body);
    await saveBadges({ ...badges, guidance: true });
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple feedback via console for now
    console.log(type === 'error' ? `Erro: ${message}` : message);
  };

  const clearBadge = (type: 'events' | 'stats' | 'guidance') => {
    const updated = { ...badges, [type]: false };
    saveBadges(updated);
  };

  const registerForPushNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      await Notifications.getExpoPushTokenAsync();
    }
  };

  return (
    <NotificationContext.Provider value={{ badges, notifyEvent, notifyStats, notifyGuidance, showNotification, clearBadge }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
