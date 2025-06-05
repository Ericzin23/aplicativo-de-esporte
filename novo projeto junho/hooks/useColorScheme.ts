import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/storage';

export function useColorScheme() {
  const systemColorScheme = useNativeColorScheme();
  const [colorScheme, setColorScheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    loadColorScheme();
  }, []);

  const loadColorScheme = async () => {
    try {
      const savedScheme = await getItem('color_scheme');
      if (savedScheme && (savedScheme === 'light' || savedScheme === 'dark')) {
        setColorScheme(savedScheme as 'light' | 'dark');
      } else {
        setColorScheme(systemColorScheme);
      }
    } catch (error) {
      setColorScheme(systemColorScheme);
    }
  };

  const toggleColorScheme = async () => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
    await setItem('color_scheme', newScheme);
  };

  return {
    colorScheme: colorScheme ?? systemColorScheme,
    toggleColorScheme,
    isDark: (colorScheme ?? systemColorScheme) === 'dark',
  };
} 