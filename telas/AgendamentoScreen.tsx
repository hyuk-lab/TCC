import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, Modal } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { listarServicos, buscarHorariosDisponiveis, criarAgendamento } from '../api/api';
import { useAlert } from '../components/AlertContext';

// Adicione esta interface no topo do arquivo, com as outras interfaces
interface IAgendamentoCriar {
  servico_id: number;
  data: string;
  horario: string;
  usuario_id: number;
}

interface IServico {
  id: number;
  nome: string;
  preco: number;
  duracao: string;
}

interface IHorarioDisponivel {
  hora: string;
  status: 'disponivel' | 'ocupado';
}

interface IAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

const CustomAlert = ({ visible, type, title, message, onClose }: IAlertProps) => {
  const getColor = () => {
    switch (type) {
      case 'success': return '#3A7CA5';
      case 'error': return '#E74C3C';
      case 'info': return '#3498DB';
      default: return '#3A7CA5';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.alertHeader, { backgroundColor: getColor() }]}>
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertMessage}>{message}</Text>
            <TouchableOpacity
              style={[styles.alertButton, { backgroundColor: getColor() }]}
              onPress={onClose}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function AgendamentoScreen(): JSX.Element {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<IServico | null>(null);
  const [date, setDate] = useState<string>('');
  const [horarios, setHorarios] = useState<IHorarioDisponivel[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Obter data atual no formato YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getCurrentDate();

  useEffect(() => {
    async function carregarServicos() {
      try {
        const servicosRaw = await listarServicos();
        const servicosTyped = servicosRaw.map((s) => ({
          ...s,
          preco: Number(s.preco) || 0,
        }));
        setServicos(servicosTyped);
      } catch (error) {
        setAlertType('error');
        setAlertTitle('Erro');
        setAlertMessage('Não foi possível carregar os serviços');
        setAlertVisible(true);
        console.error('Erro ao carregar serviços:', error);
      }
    }

    carregarServicos();
  }, []);

  useEffect(() => {
    if (date && servicoSelecionado) {
      carregarHorarios();
    }
  }, [date, servicoSelecionado]);

  async function carregarHorarios() {
    try {
      setLoading(true);
      setHorarioSelecionado(null);
      const response = await buscarHorariosDisponiveis(date);
      setHorarios(response);
    } catch (error) {
      setAlertType('error');
      setAlertTitle('Erro');
      setAlertMessage('Não foi possível carregar os horários disponíveis');
      setAlertVisible(true);
      console.error('Erro ao carregar horários:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!servicoSelecionado || !date || !horarioSelecionado) {
      setAlertType('info');
      setAlertTitle('Atenção');
      setAlertMessage('Por favor, selecione o serviço, a data e o horário');
      setAlertVisible(true);
      return;
    }

    // Obtenha o ID do usuário logado (substitua pelo valor real)
    const userId = 1; // Você deve pegar esse valor do seu sistema de autenticação

    // Criar o objeto no formato EXATO que a API espera
    const agendamentoData: IAgendamentoCriar = {
      servico_id: servicoSelecionado.id, // Note o underscore
      data: date,
      horario: horarioSelecionado,
      usuario_id: userId // Note o underscore
    };

    criarAgendamento(agendamentoData)
      .then(() => {
        setAlertType('success');
        setAlertTitle('Sucesso');
        setAlertMessage('Agendamento realizado com sucesso!');
        setAlertVisible(true);
      })
      .catch((error) => {
        console.error('Erro ao criar agendamento:', error);
        setAlertType('error');
        setAlertTitle('Erro');
        setAlertMessage('Não foi possível completar o agendamento.');
        setAlertVisible(true);
      });
  }

  const renderServico = ({ item }: { item: IServico }) => (
    <TouchableOpacity
      onPress={() => setServicoSelecionado(item)}
      style={[
        styles.servicoItem,
        servicoSelecionado?.id === item.id && styles.servicoSelecionado,
      ]}
    >
      <Text style={styles.servicoNome}>{item.nome}</Text>
      <View style={styles.servicoInfoContainer}>
        <Text style={styles.servicoPreco}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
        <Text style={styles.servicoDuracao}>{item.duracao}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHorario = ({ item }: { item: IHorarioDisponivel }) => (
    <TouchableOpacity
      disabled={item.status === 'ocupado'}
      onPress={() => setHorarioSelecionado(item.hora)}
      style={[
        styles.horarioItem,
        item.hora === horarioSelecionado && styles.horarioSelecionado,
        item.status === 'ocupado' && styles.horarioOcupado,
      ]}
    >
      <Text style={[
        styles.horarioTexto,
        item.hora === horarioSelecionado && styles.horarioTextoSelecionado,
        item.status === 'ocupado' && styles.horarioTextoOcupado
      ]}>
        {item.hora}
      </Text>
      <Text style={styles.horarioStatus}>
        {item.status === 'ocupado' ? 'Indisponível' : 'Disponível'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.tituloSecao}>Selecione o serviço</Text>
      <FlatList
        data={servicos}
        renderItem={renderServico}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.servicosLista}
        showsVerticalScrollIndicator={false}
      />

      <Text style={styles.tituloSecao}>Selecione a data</Text>
      <View style={styles.calendarioContainer}>
        <Calendar
          onDayPress={(day: DateData) => setDate(day.dateString)}
          markedDates={date ? { [date]: { selected: true, selectedColor: '#3A7CA5' } } : {}}
          minDate={minDate}
          disableAllTouchEventsForDisabledDays={true}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#3A7CA5',
            selectedDayBackgroundColor: '#3A7CA5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#3A7CA5',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            arrowColor: '#3A7CA5',
            disabledArrowColor: '#d9e1e8',
            monthTextColor: '#2d4150',
            indicatorColor: '#3A7CA5',
            'stylesheet.calendar.header': {
              week: {
                marginTop: 5,
                flexDirection: 'row',
                justifyContent: 'space-between'
              }
            }
          }}
        />
      </View>

      <Text style={styles.tituloSecao}>Selecione o horário</Text>
      {loading ? (
        <View style={styles.carregandoContainer}>
          <ActivityIndicator size="large" color="#3A7CA5" />
          <Text style={styles.carregandoTexto}>Carregando horários...</Text>
        </View>
      ) : (
        <FlatList
          data={horarios}
          renderItem={renderHorario}
          keyExtractor={(item) => item.hora}
          horizontal
          contentContainerStyle={styles.horariosLista}
          showsHorizontalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[
          styles.botaoConfirmar,
          (!servicoSelecionado || !date || !horarioSelecionado) && styles.botaoConfirmarDisabled
        ]}
        onPress={handleConfirm}
        disabled={!servicoSelecionado || !date || !horarioSelecionado}
      >
        <Text style={styles.botaoConfirmarTexto}>Confirmar Agendamento</Text>
      </TouchableOpacity>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => {
          setAlertVisible(false);
          if (alertType === 'success') {
            navigation.goBack();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F9FC',
  },
  tituloSecao: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4052',
    marginBottom: 12,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  servicosLista: {
    paddingBottom: 8,
  },
  servicoItem: {
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    shadowColor: '#3A7CA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  servicoSelecionado: {
    borderColor: '#3A7CA5',
    backgroundColor: '#F0F7FC',
    shadowOpacity: 0.15,
  },
  servicoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E4052',
    marginBottom: 6,
  },
  servicoInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  servicoPreco: {
    fontSize: 14,
    color: '#3A7CA5',
    fontWeight: '500',
  },
  servicoDuracao: {
    fontSize: 13,
    color: '#6C7A89',
  },
  calendarioContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3A7CA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  carregandoContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carregandoTexto: {
    marginTop: 10,
    color: '#6C7A89',
    fontSize: 14,
  },
  horariosLista: {
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  horarioItem: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    shadowColor: '#3A7CA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  horarioSelecionado: {
    backgroundColor: '#3A7CA5',
    borderColor: '#3A7CA5',
    shadowOpacity: 0.2,
  },
  horarioOcupado: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E1E8ED',
  },
  horarioTexto: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E4052',
  },
  horarioTextoSelecionado: {
    color: '#FFFFFF',
  },
  horarioTextoOcupado: {
    color: '#B1BEC9',
  },
  horarioStatus: {
    fontSize: 12,
    color: '#6C7A89',
    marginTop: 6,
  },
  botaoConfirmar: {
    marginTop: 32,
    backgroundColor: '#3A7CA5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2E4052',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  botaoConfirmarDisabled: {
    backgroundColor: '#B1BEC9',
    shadowColor: '#6C7A89',
  },
  botaoConfirmarTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  alertContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  alertHeader: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertBody: {
    padding: 20,
  },
  alertMessage: {
    fontSize: 16,
    color: '#2E4052',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});