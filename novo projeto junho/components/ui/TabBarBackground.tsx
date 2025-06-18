import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Simple background component to fill the area behind the bottom tab bar.
 * This avoids visual glitches on devices with a bottom safe area.
 */
export default function TabBarBackground() {
  const insets = useSafeAreaInsets();
  return <View style={[styles.background, { height: insets.bottom }]} />;
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
  },
});

export function useBottomTabOverflow() {
  const insets = useSafeAreaInsets();
  return insets.bottom;
}
