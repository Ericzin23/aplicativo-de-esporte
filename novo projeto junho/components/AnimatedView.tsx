import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewProps } from 'react-native';
import { fadeIn, scaleIn } from '../utils/animations';

interface AnimatedViewProps extends ViewProps {
  delay?: number;
  duration?: number;
  style?: any;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  delay = 0,
  duration = 300,
  style,
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        fadeIn(fadeAnim, duration),
        scaleIn(scaleAnim, duration),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, fadeAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}; 