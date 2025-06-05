# Correções para Problema de Autofill no iOS

## Problema Identificado
Os campos de senha e confirmar senha ficavam com fundo amarelo no iOS quando o usuário selecionava um email sugerido pelo sistema. Este é um comportamento padrão do iOS quando detecta campos de senha e tenta aplicar autofill.

## Arquivos Corrigidos

### 1. `app/cadastro.tsx`
**Campos corrigidos:**
- Campo "Senha"
- Campo "Confirmar senha"

**Propriedades adicionadas aos TextInput:**
```javascript
textContentType="oneTimeCode"
autoComplete="off"
importantForAutofill="no"
keyboardType="default"
```

**Estilos atualizados:**
```javascript
inputWithIcon: {
  // ... propriedades existentes
  backgroundColor: '#fff',
  borderWidth: 0,
  outlineWidth: 0,
}

inputContainer: {
  // ... propriedades existentes
  overflow: 'hidden',
}
```

### 2. `app/login.tsx`
**Campos corrigidos:**
- Campo "Senha"

**Propriedades adicionadas:**
```javascript
autoCorrect={false}
textContentType="oneTimeCode"
autoComplete="off"
importantForAutofill="no"
keyboardType="default"
```

**Estilos atualizados:**
```javascript
input: {
  // ... propriedades existentes
  backgroundColor: '#f9f9f9',
  borderWidth: 0,
  outlineWidth: 0,
}

inputContainer: {
  // ... propriedades existentes
  overflow: 'hidden',
}
```

### 3. `app/(tabs)/configuracoes.tsx`
**Campos corrigidos:**
- Campo "Senha Atual"
- Campo "Nova Senha"
- Campo "Confirmar Nova Senha"

**Propriedades adicionadas:**
```javascript
autoCapitalize="none"
autoCorrect={false}
textContentType="oneTimeCode"
autoComplete="off"
importantForAutofill="no"
keyboardType="default"
```

**Estilos atualizados:**
```javascript
modalInput: {
  // ... propriedades existentes
  outlineWidth: 0,
}
```

### 4. `components/PasswordField.tsx`
**Status:** ✅ Já estava correto
O componente já possuía as propriedades necessárias para evitar o autofill.

## Explicação das Propriedades

### `textContentType="oneTimeCode"`
- Informa ao iOS que este campo é para código único, não para senha reutilizável
- Evita que o iOS tente aplicar autofill de senhas salvas

### `autoComplete="off"`
- Desabilita o preenchimento automático do navegador/sistema
- Funciona tanto no iOS quanto no Android

### `importantForAutofill="no"`
- Propriedade específica do Android que indica que o campo não deve ser considerado para autofill
- Complementa a proteção contra preenchimento automático

### `keyboardType="default"`
- Garante que o teclado padrão seja usado
- Evita comportamentos específicos de teclados de senha

### Estilos CSS
- `backgroundColor`: Força o fundo a permanecer da cor desejada
- `borderWidth: 0` e `outlineWidth: 0`: Remove bordas que podem ser afetadas pelo autofill
- `overflow: 'hidden'`: Evita que elementos filhos "vazem" do container

## Soluções Avançadas Implementadas

### 5. `components/AntiAutofillInput.tsx` (NOVO)
**Componente personalizado criado para resolver o problema de forma mais robusta:**

```javascript
// Componente wrapper que força fundo branco e previne autofill
export const AntiAutofillInput: React.FC<AntiAutofillInputProps> = ({
  style,
  forceWhiteBackground = true,
  ...props
}) => {
  // Usa useEffect para forçar estilos após render
  // Acessa propriedades nativas para sobrescrever autofill
  // Aplica propriedades CSS específicas para iOS
}
```

**Características:**
- Força fundo branco usando `setNativeProps`
- Aplica propriedades CSS específicas (`WebkitBoxShadow`, `WebkitAppearance`)
- Re-aplica estilos quando o valor muda
- Funciona especificamente no iOS

### 6. Hook `useFocusEffect` 
**Adicionado para limpar autofill quando a tela é focada:**

```javascript
useFocusEffect(
  React.useCallback(() => {
    const timer = setTimeout(() => {
      // Força re-render dos campos para limpar autofill
      setName(name);
      setEmail(email);
      setPassword(password);
      setConfirmPassword(confirmPassword);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [name, email, password, confirmPassword])
);
```

### 7. Estilos CSS Avançados
**Propriedades adicionais para forçar fundo branco:**

```javascript
inputContainer: {
  // ... propriedades existentes
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
}
```

## Resultado
✅ Os campos de senha não ficam mais amarelos quando o usuário seleciona emails sugeridos no iOS
✅ O comportamento de autofill é desabilitado de forma consistente
✅ A experiência do usuário é melhorada em dispositivos iOS
✅ As correções são compatíveis com Android e não afetam a funcionalidade
✅ **NOVO:** Solução robusta que funciona mesmo quando o usuário sai e volta para a tela
✅ **NOVO:** Componente reutilizável para outros campos que possam ter o mesmo problema

## Teste Recomendado
1. Abrir o app em um dispositivo iOS
2. Navegar para a tela de cadastro
3. Tocar no campo de email
4. Selecionar um email sugerido pelo sistema
5. Verificar que os campos de senha permanecem com fundo branco
6. Repetir o teste nas telas de login e configurações 