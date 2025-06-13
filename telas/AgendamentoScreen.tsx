// src/telas/AgendamentoScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import {
  listarServicos,
  buscarHorariosDisponiveis,
  criarAgendamento
} from '../api/api';
import { useAlert } from '../components/AlertContext';

interface IAgendamentoCriar {
  servico_id: number;
  data: string;
  horario: string;
  usuario_id: number;
}

interface IServico {
  id: number;
  nome: string;
  preco: number | null;
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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

// Formata preço em R$ 00,00
const formatPreco = (preco?: number | null) => {
  const valor = typeof preco === 'number' && !isNaN(preco) ? preco : 0;
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
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

  const getCurrentDate = () => {
    const today = new Date();
    const Y = today.getFullYear();
    const M = String(today.getMonth() + 1).padStart(2, '0');
    const D = String(today.getDate()).padStart(2, '0');
    return `${Y}-${M}-${D}`;
  };
  const minDate = getCurrentDate();

  // Carrega serviços
  useEffect(() => {
    listarServicos()
      .then(raw =>
        setServicos(
          raw.map((s: any) => ({
            id: s.id,
            nome: s.nome,
            preco: isNaN(Number(s.preco)) ? 0 : Number(s.preco),
            duracao: s.duracao
          }))
        )
      )
      .catch(() => showAlert('error', 'Falha ao carregar serviços', 'error'));
  }, []);

  // Busca horários sempre que data ou serviço mudar
  useEffect(() => {
    if (date && servicoSelecionado) {
      setLoading(true);
      buscarHorariosDisponiveis(date)
        .then(resp => setHorarios(resp))
        .catch(() => showAlert('error', 'Não foi possível carregar horários', 'error'))
        .finally(() => setLoading(false));
    }
  }, [date, servicoSelecionado]);

  // Confirma agendamento
  const handleConfirm = () => {
    if (!servicoSelecionado || !date || !horarioSelecionado) {
      setAlertType('info');
      setAlertTitle('Atenção');
      setAlertMessage('Selecione serviço, data e horário');
      setAlertVisible(true);
      return;
    }
    const data: IAgendamentoCriar = {
      servico_id: servicoSelecionado.id,
      data: date,
      horario: horarioSelecionado,
      usuario_id: 1
    };
    criarAgendamento(data)
      .then(() => {
        setAlertType('success');
        setAlertTitle('Sucesso');
        setAlertMessage('Agendamento realizado!');
        setAlertVisible(true);
      })
      .catch(() => {
        setAlertType('error');
        setAlertTitle('Erro');
        setAlertMessage('Falha ao criar agendamento');
        setAlertVisible(true);
      });
  };

  // Renderiza cada horário com status
  const renderHorario = ({ item }: { item: IHorarioDisponivel }) => {
    const disponivel = item.status === 'disponivel';
    const selecionado = item.hora === horarioSelecionado;
    return (
      <TouchableOpacity
        disabled={!disponivel}
        onPress={() => setHorarioSelecionado(item.hora)}
        style={[
          styles.horarioItem,
          selecionado && styles.horarioSelecionado,
          !disponivel && styles.horarioOcupado,
        ]}
      >
        <Text
          style={[
            styles.horarioTexto,
            selecionado && styles.horarioTextoSelecionado,
            !disponivel && styles.horarioTextoOcupado,
          ]}
        >
          {item.hora}
        </Text>
        <Text style={styles.horarioStatus}>
          {disponivel ? 'Disponível' : 'Indisponível'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tituloSecao}>Selecione o serviço</Text>
      <FlatList
        data={servicos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id.toString()}
        contentContainerStyle={styles.servicosLista}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setServicoSelecionado(item)}
            style={[
              styles.servicoItem,
              servicoSelecionado?.id === item.id && styles.servicoSelecionado
            ]}
          >
            <Text style={styles.servicoNome}>{item.nome}</Text>
            <Text style={styles.servicoPreco}>{formatPreco(item.preco)}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.tituloSecao}>Selecione a data</Text>
      <Calendar
        onDayPress={(d: DateData) => setDate(d.dateString)}
        markedDates={date ? { [date]: { selected: true, selectedColor: '#3A7CA5' } } : {}}
        minDate={minDate}
        theme={{
          selectedDayBackgroundColor: '#3A7CA5',
          todayTextColor: '#3A7CA5',
          arrowColor: '#3A7CA5'
        }}
        style={styles.calendarioContainer}
      />

      <Text style={styles.tituloSecao}>Selecione o horário</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3A7CA5" style={styles.carregandoContainer} />
      ) : (
        <FlatList
          data={horarios}
          renderItem={renderHorario}
          keyExtractor={i => i.hora}
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
          if (alertType === 'success') navigation.goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F9FC' },
  tituloSecao: { fontSize: 18, fontWeight: '600', color: '#2E4052', marginVertical: 12 },
  servicosLista: { paddingVertical: 8 },
  servicoItem: { padding: 18, marginRight: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E1E8ED', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  servicoSelecionado: { borderColor: '#3A7CA5', backgroundColor: '#F0F7FC' },
  servicoNome: { fontSize: 16, fontWeight: '600', color: '#2E4052', marginBottom: 4 },
  servicoPreco: { fontSize: 14, color: '#3A7CA5' },
  calendarioContainer: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#3A7CA5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3, marginBottom: 12 },
  carregandoContainer: { padding: 20, alignItems: 'center' },
  horariosLista: { paddingVertical: 10 },
  horarioItem: { paddingVertical: 14, paddingHorizontal: 22, marginRight: 12, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E1E8ED', alignItems: 'center', justifyContent: 'center', minWidth: 100, elevation: 1 },
  horarioSelecionado: { backgroundColor: '#3A7CA5', borderColor: '#3A7CA5' },
  horarioOcupado: { backgroundColor: '#F8FAFC', borderColor: '#E1E8ED' },
  horarioTexto: { fontSize: 16, fontWeight: '500', color: '#2E4052' },
  horarioTextoSelecionado: { color: '#FFFFFF' },
  horarioTextoOcupado: { color: '#B1BEC9' },
  horarioStatus: { fontSize: 12, color: '#6C7A89', marginTop: 4 },
  botaoConfirmar: { marginTop: 32, backgroundColor: '#3A7CA5', padding: 18, borderRadius: 12, alignItems: 'center', elevation: 3 },
  botaoConfirmarDisabled: { backgroundColor: '#B1BEC9' },
  botaoConfirmarTexto: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  alertOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  alertContainer: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', elevation: 5 },
  alertHeader: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  alertBody: { padding: 20 },
  alertMessage: { fontSize: 16, color: '#2E4052', marginBottom: 20, textAlign: 'center' },
  alertButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
  alertButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
