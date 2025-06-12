import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useColorScheme();
  useEffect(() => {
    const theme = isDark ? Colors.dark : Colors.light;
    (Text as any).defaultProps = {
      ...((Text as any).defaultProps || {}),
      style: [{ color: theme.text }, ((Text as any).defaultProps && (Text as any).defaultProps.style) || {}],
    };
  }, [isDark]);

  return <View style={{ flex: 1, backgroundColor: isDark ? Colors.dark.background : Colors.light.background }}>{children}</View>;
}
