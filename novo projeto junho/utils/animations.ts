import { Animated } from 'react-native';

export const fadeIn = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const fadeOut = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const scaleIn = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const scaleOut = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0.8,
    duration,
    useNativeDriver: true,
  });
};

export const slideInFromRight = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const slideInFromLeft = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const bounceIn = (animatedValue: Animated.Value, duration: number = 600) => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    friction: 4,
    tension: 100,
    useNativeDriver: true,
  });
}; 