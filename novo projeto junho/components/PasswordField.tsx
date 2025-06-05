import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  useSharedValue
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  showStrength?: boolean;
  onStrengthChange?: (strength: number) => void;
}

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  showStrength = false,
  onStrengthChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = calculatePasswordStrength(value);
  const strengthOpacity = useSharedValue(0);
  const strengthHeight = useSharedValue(0);

  const strengthStyle = useAnimatedStyle(() => {
    return {
      opacity: strengthOpacity.value,
      height: strengthHeight.value,
      transform: [
        {
          translateY: interpolate(
            strengthHeight.value,
            [0, height * 0.03],
            [0, height * 0.005]
          )
        }
      ]
    };
  });

  React.useEffect(() => {
    if (value.length > 0 && showStrength) {
      strengthOpacity.value = withTiming(1, { duration: 300 });
      strengthHeight.value = withSpring(height * 0.03, { damping: 12 });
    } else {
      strengthOpacity.value = withTiming(0, { duration: 200 });
      strengthHeight.value = withSpring(0, { damping: 12 });
    }
  }, [value, showStrength]);

  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0:
      case 1:
        return '#EF4444'; // Vermelho
      case 2:
        return '#F59E0B'; // Amarelo
      case 3:
        return '#3B82F6'; // Azul
      case 4:
        return '#10B981'; // Verde
      default:
        return '#E5E7EB'; // Cinza
    }
  };

  const getStrengthText = (strength: number): string => {
    switch (strength) {
      case 0:
      case 1:
        return 'Muito Fraca';
      case 2:
        return 'Fraca';
      case 3:
        return 'Média';
      case 4:
        return 'Forte';
      default:
        return '';
    }
  };

  const handlePasswordChange = (text: string) => {
    onChangeText(text);
    if (showStrength && onStrengthChange) {
      const newStrength = calculatePasswordStrength(text);
      onStrengthChange(newStrength);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handlePasswordChange}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          autoCorrect={false}
          autoComplete="off"
          textContentType="oneTimeCode"
          keyboardType="default"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          importantForAutofill="no"
          textAlign="left"
          clearButtonMode="never"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={width * 0.05}
            color="#4A4A4A"
          />
        </TouchableOpacity>
      </View>
      {showStrength && (
        <Animated.View style={[styles.strengthContainer, strengthStyle]}>
          <View style={styles.strengthBars}>
            {[...Array(4)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.strengthBar,
                  index < strength && { backgroundColor: getStrengthColor(strength) }
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthText, { color: getStrengthColor(strength) }]}>
            {getStrengthText(strength)}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: height * 0.015,
    width: '100%',
  },
  label: {
    fontSize: width * 0.035,
    marginBottom: height * 0.008,
    color: '#4A4A4A',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: width * 0.04,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    height: height * 0.06,
  },
  input: {
    flex: 1,
    fontSize: width * 0.04,
    color: '#1A1A1A',
    padding: width * 0.04,
    height: '100%',
  },
  eyeIcon: {
    padding: width * 0.03,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    height: '100%',
    justifyContent: 'center',
  },
  strengthContainer: {
    overflow: 'hidden',
    padding: width * 0.02,
    backgroundColor: '#F8FAFF',
    borderRadius: width * 0.02,
    marginTop: height * 0.005,
    minHeight: height * 0.03,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: width * 0.005,
    marginBottom: height * 0.008,
  },
  strengthBar: {
    height: height * 0.002,
    borderRadius: width * 0.002,
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  strengthText: {
    fontSize: width * 0.03,
    fontWeight: '600',
    lineHeight: height * 0.02,
  },
}); 