import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, Animated, TextInput, Dimensions } from 'react-native';
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import { setItem, StorageKeys } from '../utils/storage';

const { width, height } = Dimensions.get('window');

const ESPORTES = [
  'Futebol', 'Basquete', 'Vôlei', 'Natação', 'Atletismo', 'Tênis', 'Boxe', 'MMA',
  'Karatê', 'Judô', 'Ciclismo', 'Handebol', 'Rugby', 'Golfe', 'Surfe', 'Skate',
  'Tênis de Mesa', 'Badminton', 'Esgrima', 'Hipismo'
];

const POSICOES = {
  'Futebol': ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-Campo', 'Atacante'],
  'Basquete': ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'],
  'Vôlei': ['Levantador', 'Oposto', 'Ponteiro', 'Central', 'Líbero'],
  'Natação': ['Nado Livre', 'Nado Costas', 'Nado Peito', 'Nado Borboleta', 'Medley'],
  'Tênis': ['Simples', 'Duplas'],
  'Boxe': ['Peso Mosca', 'Peso Galo', 'Peso Pena', 'Peso Leve', 'Peso Médio'],
  'MMA': ['Peso Palha', 'Peso Mosca', 'Peso Galo', 'Peso Pena', 'Peso Leve'],
  'Karatê': ['Faixa Branca', 'Faixa Amarela', 'Faixa Verde', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
  'Judô': ['Faixa Branca', 'Faixa Amarela', 'Faixa Verde', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
  'Ciclismo': ['Estrada', 'Mountain Bike', 'BMX', 'Pista'],
  'Handebol': ['Goleiro', 'Ponta', 'Meio', 'Armador', 'Pivô'],
  'Rugby': ['Pilar', 'Hooker', 'Segunda Linha', 'Terceira Linha', 'Meio Scrum', 'Abertura', 'Centro', 'Ponta', 'Fullback'],
  'Golfe': ['Profissional', 'Amador'],
  'Surfe': ['Shortboard', 'Longboard', 'Bodyboard', 'SUP'],
  'Skate': ['Street', 'Vert', 'Park', 'Freestyle'],
  'Tênis de Mesa': ['Simples', 'Duplas'],
  'Badminton': ['Simples', 'Duplas'],
  'Esgrima': ['Florete', 'Espada', 'Sabre'],
  'Hipismo': ['Adestramento', 'Saltos', 'Concurso Completo']
};

const PERIODOS = {
  MANHA: {
    nome: 'Manhã',
    horarios: ['7h', '8h', '9h', '10h', '11h']
  },
  TARDE: {
    nome: 'Tarde',
    horarios: ['13h', '14h', '15h', '16h', '17h']
  },
  NOITE: {
    nome: 'Noite',
    horarios: ['18h', '19h', '20h', '21h', '22h']
  }
};

export default function CadastroProfissionalScreen() {
  const [esporte, setEsporte] = useState<string | null>(null);
  const [posicao, setPosicao] = useState<string | null>(null);
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [openEsporte, setOpenEsporte] = useState(false);
  const [openPosicao, setOpenPosicao] = useState(false);
  const [periodosExpandidos, setPeriodosExpandidos] = useState<Record<string, boolean>>({});
  const [horariosSelecionados, setHorariosSelecionados] = useState<Record<string, boolean>>({});
  const [participouCampeonatos, setParticipouCampeonatos] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const togglePeriodo = useCallback((periodo: string) => {
    setPeriodosExpandidos(prev => ({
      ...prev,
      [periodo]: !prev[periodo]
    }));
  }, []);

  const toggleHorario = useCallback((horario: string) => {
    setHorariosSelecionados(prev => ({
      ...prev,
      [horario]: !prev[horario]
    }));
  }, []);

  const handleSalvar = useCallback(async () => {
    if (!validarFormulario()) return;

    try {
      const dadosProfissionais = {
        esporte,
        posicao,
        anosExperiencia,
        horarios: horariosSelecionados,
        participouCampeonatos
      };

      await setItem(StorageKeys.DADOS_PROFISSIONAIS, dadosProfissionais);
      
      Alert.alert(
        'Sucesso',
        'Cadastro profissional concluído com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente.');
    }
  }, [esporte, posicao, anosExperiencia, horariosSelecionados, participouCampeonatos]);

  const validarFormulario = useCallback(() => {
    if (!esporte || !posicao || !anosExperiencia || Object.keys(horariosSelecionados).length === 0 || participouCampeonatos === null) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos obrigatórios e selecione pelo menos um horário');
      return false;
    }
    return true;
  }, [esporte, posicao, anosExperiencia, horariosSelecionados, participouCampeonatos]);

  // Otimizar listas de opções com useMemo
  const esportesOptions = useMemo(() => 
    ESPORTES.map(esporte => ({ label: esporte, value: esporte }))
  , []);

  const posicoesOptions = useMemo(() => 
    esporte ? POSICOES[esporte as keyof typeof POSICOES]?.map(posicao => ({ label: posicao, value: posicao })) || [] : []
  , [esporte]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.card,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.title}>Cadastro Profissional</Text>

              {/* Esporte */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Qual esporte você pratica?</Text>
                <DropDownPicker
                  open={openEsporte}
                  value={esporte}
                  items={esportesOptions}
                  setOpen={setOpenEsporte}
                  setValue={setEsporte}
                  placeholder="Selecione o esporte"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  zIndex={3000}
                  zIndexInverse={1000}
                  listMode="MODAL"
                  searchable={true}
                  searchPlaceholder="Buscar esporte..."
                  searchTextInputStyle={styles.searchInput}
                />
              </View>

              {/* Posição */}
              {esporte && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Qual posição você joga?</Text>
                  <DropDownPicker
                    open={openPosicao}
                    value={posicao}
                    items={posicoesOptions}
                    setOpen={setOpenPosicao}
                    setValue={setPosicao}
                    placeholder="Selecione a posição"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    zIndex={2000}
                    zIndexInverse={2000}
                    listMode="MODAL"
                  />
                </View>
              )}

              {/* Anos de Experiência */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Quantos anos de experiência você tem?</Text>
                <TextInput
                  style={styles.input}
                  value={anosExperiencia}
                  onChangeText={setAnosExperiencia}
                  placeholder="Digite o número de anos"
                  keyboardType="numeric"
                />
              </View>

              {/* Participação em Campeonatos */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Já participou de campeonatos?</Text>
                <View style={styles.campeonatosContainer}>
                  <TouchableOpacity
                    style={[
                      styles.campeonatoButton,
                      participouCampeonatos === true && styles.campeonatoButtonSelected
                    ]}
                    onPress={() => setParticipouCampeonatos(true)}
                  >
                    <Text style={[
                      styles.campeonatoButtonText,
                      participouCampeonatos === true && styles.campeonatoButtonTextSelected
                    ]}>
                      Sim
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.campeonatoButton,
                      participouCampeonatos === false && styles.campeonatoButtonSelected
                    ]}
                    onPress={() => setParticipouCampeonatos(false)}
                  >
                    <Text style={[
                      styles.campeonatoButtonText,
                      participouCampeonatos === false && styles.campeonatoButtonTextSelected
                    ]}>
                      Não
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horários Disponíveis */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Horários Disponíveis</Text>
                <Text style={styles.horariosDescription}>
                  Selecione quantos horários desejar em cada período (manhã, tarde e noite).
                </Text>
                <View style={styles.periodosContainer}>
                  {Object.entries(PERIODOS).map(([key, periodo]) => (
                    <View key={key} style={styles.periodoContainer}>
                      <TouchableOpacity
                        style={[
                          styles.periodoButton,
                          periodosExpandidos[key] && styles.periodoButtonExpanded
                        ]}
                        onPress={() => togglePeriodo(key)}
                      >
                        <Text style={styles.periodoText}>{periodo.nome}</Text>
                        <Ionicons
                          name={periodosExpandidos[key] ? 'chevron-down' : 'chevron-forward'}
                          size={20}
                          color="#4A4A4A"
                        />
                      </TouchableOpacity>
                      
                      {periodosExpandidos[key] && (
                        <View style={styles.horariosContainer}>
                          {periodo.horarios.map(horario => (
                            <TouchableOpacity
                              key={horario}
                              style={[
                                styles.horarioButton,
                                horariosSelecionados[horario] && styles.horarioButtonSelected
                              ]}
                              onPress={() => toggleHorario(horario)}
                            >
                              <Text style={[
                                styles.horarioText,
                                horariosSelecionados[horario] && styles.horarioTextSelected
                              ]}>
                                {horario}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.button,
                  (!esporte || !posicao || !anosExperiencia || Object.keys(horariosSelecionados).length === 0 || participouCampeonatos === null) && styles.buttonDisabled
                ]} 
                onPress={handleSalvar}
                disabled={!esporte || !posicao || !anosExperiencia || Object.keys(horariosSelecionados).length === 0 || participouCampeonatos === null}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    padding: 25,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: '#4A4A4A',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownContainer: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    height: 40,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  periodosContainer: {
    gap: 12,
  },
  periodoContainer: {
    gap: 8,
  },
  periodoButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodoButtonExpanded: {
    borderColor: '#6366F1',
  },
  periodoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  horariosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
  },
  horarioButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  horarioButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  horarioText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  horarioTextSelected: {
    color: '#FFFFFF',
  },
  horariosDescription: {
    fontSize: width * 0.03,
    color: '#666666',
    marginBottom: height * 0.015,
    fontStyle: 'italic',
    lineHeight: height * 0.02,
    letterSpacing: 0.2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: width * 0.05,
    paddingTop: Platform.OS === 'ios' ? height * 0.06 : height * 0.04,
  },
  backButton: {
    padding: width * 0.02,
    borderRadius: width * 0.02,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  campeonatosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  campeonatoButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  campeonatoButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  campeonatoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  campeonatoButtonTextSelected: {
    color: '#FFFFFF',
  },
}); 