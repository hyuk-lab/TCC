import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import {
  listarServicos,
  buscarHorariosDisponiveis,
  criarAgendamento,
  IServico,
  IHorarioDisponivel
} from '../api/api';
import { useAlert } from '../components/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import { scheduleAppointmentNotification, requestNotificationPermissions } from '../utils/notificationService'; // Import notification service
import { StackNavigationProp } from '@react-navigation/stack'; // Importar StackNavigationProp
import { RootStackParamList } from '../routes/routes'; // Importar RootStackParamList

interface IAgendamentoCriar {
  servico_id: number;
  data: string;
  horario: string;
  usuario_id: number;
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
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'info':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <View style={[styles.alertHeader, { backgroundColor: getColor() }]}>
            <Text style={styles.alertTitle}>{title}</Text>
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertMessage}>{message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={onClose}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Definir o tipo de navegação para esta tela
type AgendamentoNav = StackNavigationProp<RootStackParamList, 'Agendamento'>;

export default function AgendamentoScreen() {
  const navigation = useNavigation<AgendamentoNav>(); // Usar o tipo específico aqui
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [selectedServico, setSelectedServico] = useState<IServico | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [horarios, setHorarios] = useState<IHorarioDisponivel[]>([]);
  const [selectedHorario, setSelectedHorario] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [horariosLoading, setHorariosLoading] = useState<boolean>(false);

  useEffect(() => {
    const initScreen = async () => {
      // Solicita permissões de notificação ao carregar a tela
      await requestNotificationPermissions();
      fetchServicos();
    };
    initScreen();
  }, []);

  const fetchServicos = async () => {
    setLoading(true);
    try {
      const data = await listarServicos();
      setServicos(data);
    } catch (error) {
      console.error('Erro ao listar serviços:', error);
      showAlert('Erro', 'Não foi possível carregar os serviços.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchHorarios = async () => {
      if (selectedDate && selectedServico) {
        setHorariosLoading(true);
        try {
          const duracaoMatch = selectedServico.duracao.match(/(\d+)(?:\s*horas?|\s*h)?(?:\s*e\s*)?(\d+)?(?:\s*minutos?)?/);
          let duracaoEmMinutos = 30;
          if (duracaoMatch) {
            const hours = parseInt(duracaoMatch[1] || '0');
            const minutes = parseInt(duracaoMatch[2] || '0');
            duracaoEmMinutos = hours * 60 + minutes;
          } else {
            const minutesMatch = selectedServico.duracao.match(/(\d+)\s*minutos?/);
            if (minutesMatch) {
              duracaoEmMinutos = parseInt(minutesMatch[1]);
            }
          }
          const data = await buscarHorariosDisponiveis(selectedDate, duracaoEmMinutos);
          setHorarios(data);
          setSelectedHorario('');
        } catch (error) {
          console.error('Erro ao buscar horários:', error);
          showAlert('Erro', 'Não foi possível carregar os horários disponíveis.', 'error');
        } finally {
          setHorariosLoading(false);
        }
      } else {
        setHorarios([]);
      }
    };
    fetchHorarios();
  }, [selectedDate, selectedServico]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleAgendamento = async () => {
    if (!selectedServico || !selectedDate || !selectedHorario || !user?.id) {
      showAlert('Atenção', 'Por favor, selecione um serviço, data e horário.', 'info');
      return;
    }

    setLoading(true);
    try {
      const agendamentoData: IAgendamentoCriar = {
        servico_id: selectedServico.id,
        data: selectedDate,
        horario: selectedHorario,
        usuario_id: user.id,
      };
      const response = await criarAgendamento(agendamentoData);
      const newAppointmentId = response.id;

      // Construindo o objeto Date para a notificação
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hour, minute] = selectedHorario.split(':').map(Number);
      const appointmentDateTime = new Date(year, month - 1, day, hour, minute); // Month is 0-indexed

      await scheduleAppointmentNotification(
        newAppointmentId,
        selectedServico.nome,
        appointmentDateTime
      );

      showAlert('Sucesso', 'Agendamento realizado com sucesso!', 'success');
      // CORREÇÃO: Passando parâmetros de forma segura
      navigation.navigate('MeusAgendamentos', { newAppointmentId: newAppointmentId });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      const errorMessage = (error as any).response?.data?.error || 'Não foi possível realizar o agendamento. Tente novamente.';
      showAlert('Erro', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (selectedDate && selectedServico) {
        const fetchHorariosOnFocus = async () => {
          setHorariosLoading(true);
          try {
            const duracaoMatch = selectedServico.duracao.match(/(\d+)(?:\s*horas?|\s*h)?(?:\s*e\s*)?(\d+)?(?:\s*minutos?)?/);
            let duracaoEmMinutos = 30;
            if (duracaoMatch) {
              const hours = parseInt(duracaoMatch[1] || '0');
              const minutes = parseInt(duracaoMatch[2] || '0');
              duracaoEmMinutos = hours * 60 + minutes;
            } else {
              const minutesMatch = selectedServico.duracao.match(/(\d+)\s*minutos?/);
              if (minutesMatch) {
                duracaoEmMinutos = parseInt(minutesMatch[1]);
              }
            }
            const data = await buscarHorariosDisponiveis(selectedDate, duracaoEmMinutos);
            setHorarios(data);
          } catch (error) {
            console.error('Erro ao buscar horários ao focar:', error);
          } finally {
            setHorariosLoading(false);
          }
        };
        fetchHorariosOnFocus();
      }
    }, [selectedDate, selectedServico])
  );

  const renderHorarioItem = ({ item }: { item: IHorarioDisponivel }) => {
    const isSelected = item.hora === selectedHorario;
    const isDisabled = item.status === 'ocupado' || item.status === 'passado';

    return (
      <TouchableOpacity
        style={[
          styles.horarioCard,
          isSelected && styles.horarioSelecionado,
          item.status === 'ocupado' && styles.horarioOcupado,
          item.status === 'passado' && styles.horarioPassado,
          isDisabled && styles.horarioDisabled,
        ]}
        onPress={() => !isDisabled && setSelectedHorario(item.hora)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.horarioTexto,
            isSelected && styles.horarioTextoSelecionado,
            item.status === 'ocupado' && styles.horarioTextoOcupado,
            item.status === 'passado' && styles.horarioTextoOcupado,
          ]}
        >
          {item.hora}
        </Text>
        {item.status !== 'disponivel' && (
          <Text
            style={[
              styles.horarioStatus,
              item.status === 'ocupado' && styles.horarioTextoOcupado,
              item.status === 'passado' && styles.horarioTextoOcupado,
            ]}
          >
            {item.status === 'ocupado' ? 'Ocupado' : 'Passado'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agendamento</Text>

      {/* Seleção de Serviço */}
      <Text style={styles.sectionTitle}>Selecione o Serviço:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3A7CA5" />
      ) : (
        <FlatList
          data={servicos}
          keyExtractor={(item) => item.id.toString()} // CORREÇÃO AQUI
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.servicoCard,
                selectedServico?.id === item.id && styles.servicoSelecionado,
              ]}
              onPress={() => setSelectedServico(item)}
            >
              <Text style={[
                styles.servicoTexto,
                selectedServico?.id === item.id && styles.servicoTextoSelecionado
              ]}>
                {item.nome}
              </Text>
              <Text style={[
                styles.servicoPreco,
                selectedServico?.id === item.id && styles.servicoTextoSelecionado
              ]}>
                R$ {parseFloat(item.preco.toString()).toFixed(2).replace('.', ',')}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Seleção de Data */}
      <Text style={styles.sectionTitle}>Selecione a Data:</Text>
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={
            selectedDate
              ? {
                [selectedDate]: {
                  selected: true,
                  marked: true,
                  selectedColor: '#3A7CA5',
                },
              }
              : {}
          }
          minDate={new Date().toISOString().split('T')[0]}
          theme={{
            selectedDayBackgroundColor: '#3A7CA5',
            todayTextColor: '#3A7CA5',
            arrowColor: '#3A7CA5',
            monthTextColor: '#2E4052',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
          }}
        />
      </View>

      {/* Seleção de Horário */}
      <Text style={styles.sectionTitle}>Selecione o Horário:</Text>
      {horariosLoading ? (
        <ActivityIndicator size="small" color="#3A7CA5" />
      ) : (
        <FlatList
          data={horarios}
          keyExtractor={(item) => item.hora}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderHorarioItem}
          ListEmptyComponent={
            <Text style={styles.emptyHorarios}>Nenhum horário disponível para a data selecionada.</Text>
          }
        />
      )}

      <TouchableOpacity
        style={[
          styles.botaoConfirmar,
          (!selectedServico || !selectedDate || !selectedHorario || loading) &&
          styles.botaoConfirmarDisabled,
        ]}
        onPress={handleAgendamento}
        disabled={!selectedServico || !selectedDate || !selectedHorario || loading}
      >
        <Text style={styles.botaoConfirmarTexto}>
          {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E4052',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4052',
    marginTop: 20,
    marginBottom: 12,
  },
  servicoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
    shadowColor: '#2E4052',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 120,
  },
  servicoSelecionado: {
    backgroundColor: '#3A7CA5',
    borderColor: '#3A7CA5',
  },
  servicoTexto: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E4052',
  },
  servicoTextoSelecionado: {
    color: '#FFFFFF',
  },
  servicoPreco: {
    fontSize: 14,
    color: '#6C7A89',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#2E4052',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  horarioCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    elevation: 1,
  },
  horarioSelecionado: {
    backgroundColor: '#3A7CA5',
    borderColor: '#3A7CA5',
  },
  horarioOcupado: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E1E8ED',
  },
  horarioPassado: { // Re-adicionado
    backgroundColor: '#F0F3F7',
    borderColor: '#D3DBE0',
    opacity: 0.7,
  },
  horarioDisabled: { // Re-adicionado
    opacity: 0.6,
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
    marginTop: 4,
  },
  botaoConfirmar: {
    marginTop: 32,
    backgroundColor: '#3A7CA5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  botaoConfirmarDisabled: {
    backgroundColor: '#B1BEC9',
  },
  botaoConfirmarTexto: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  alertHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  alertTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertBody: {
    padding: 20,
    alignItems: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#3A7CA5',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyHorarios: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#6C7A89',
  },
});
