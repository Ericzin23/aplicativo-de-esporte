import React, { useEffect, useRef } from 'react';
import { TextInput, TextInputProps, Platform } from 'react-native';

interface AntiAutofillInputProps extends TextInputProps {
  forceWhiteBackground?: boolean;
}

export const AntiAutofillInput: React.FC<AntiAutofillInputProps> = ({
  style,
  forceWhiteBackground = true,
  ...props
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (Platform.OS === 'ios' && inputRef.current && forceWhiteBackground) {
      // Força apenas o fundo branco após um pequeno delay para sobrescrever autofill
      const timer = setTimeout(() => {
        if (inputRef.current) {
          try {
            // Força apenas propriedades relacionadas ao fundo amarelo
            inputRef.current.setNativeProps({
              style: {
                backgroundColor: style && typeof style === 'object' && 'backgroundColor' in style 
                  ? style.backgroundColor 
                  : '#fff',
                WebkitBoxShadow: 'none',
                boxShadow: 'none',
              }
            });
          } catch (error) {
            // Silenciosamente ignora erros de acesso nativo
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [forceWhiteBackground, props.value, style]);

  // Preserva o estilo original, apenas adiciona proteção contra autofill
  const combinedStyle = [
    style,
    forceWhiteBackground && {
      // Apenas propriedades específicas para prevenir fundo amarelo
      WebkitBoxShadow: 'none',
      boxShadow: 'none',
    },
  ];

  // Propriedades anti-autofill inteligentes que preservam funcionalidade
  const antiAutofillProps = {
    // Apenas para campos de senha, usa oneTimeCode para prevenir autofill
    textContentType: props.secureTextEntry ? "oneTimeCode" : props.textContentType || "none",
    // Preserva autoComplete se especificado, senão desabilita
    autoComplete: props.autoComplete || "off",
    // Preserva importantForAutofill se especificado
    importantForAutofill: props.importantForAutofill || "no",
    // Preserva autoCorrect se especificado, senão usa padrão baseado no tipo
    autoCorrect: props.autoCorrect !== undefined ? props.autoCorrect : !props.secureTextEntry,
    // Preserva spellCheck se especificado
    spellCheck: props.spellCheck !== undefined ? props.spellCheck : !props.secureTextEntry,
  };

  return (
    <TextInput
      ref={inputRef}
      style={combinedStyle}
      {...antiAutofillProps}
      {...props}
    />
  );
}; 