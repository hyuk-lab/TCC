import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { listarServicos, buscarHorariosDisponiveis, criarAgendamento } from '../services/api';

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

export default function AgendamentoScreen(): JSX.Element {
  const navigation = useNavigation();
  const [servicos, setServicos] = useState<IServico[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState<IServico | null>(null);
  const [date, setDate] = useState<string>('');
  const [horarios, setHorarios] = useState<IHorarioDisponivel[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const response = await buscarHorariosDisponiveis(date);
      setHorarios(response);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!servicoSelecionado || !date || !horarioSelecionado) {
      Alert.alert('Erro', 'Selecione o serviço, a data e o horário');
      return;
    }

    criarAgendamento(servicoSelecionado.id, date, horarioSelecionado)
      .then(() => {
        Alert.alert('Sucesso', 'Agendamento criado!');
        navigation.goBack();
      })
      .catch(() => {
        Alert.alert('Erro', 'Não foi possível agendar.');
      });
  }

  const renderServico = ({ item }: { item: IServico }) => (
    <TouchableOpacity
      onPress={() => setServicoSelecionado(item)}
      style={[
        styles.servicoItem,
        servicoSelecionado?.id === item.id && styles.selected,
      ]}
    >
      <Text style={styles.servicoNome}>{item.nome}</Text>
      <Text style={styles.servicoPreco}>R$ {item.preco.toFixed(2).replace('.', ',')}</Text>
      <Text style={styles.servicoDuracao}>{item.duracao}</Text>
    </TouchableOpacity>
  );

  const renderHorario = ({ item }: { item: IHorarioDisponivel }) => (
    <TouchableOpacity
      disabled={item.status === 'ocupado'}
      onPress={() => setHorarioSelecionado(item.hora)}
      style={[
        styles.card,
        item.hora === horarioSelecionado && styles.selected,
        item.status === 'ocupado' && styles.disabled,
      ]}
    >
      <Text>{item.hora}</Text>
      <Text>{item.status === 'ocupado' ? 'Ocupado' : 'Disponível'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text>Selecione o serviço:</Text>
      <FlatList
        data={servicos}
        renderItem={renderServico}
        keyExtractor={(item) => item.id.toString()}
      />

      <Text style={{ marginTop: 10 }}>Selecione a data:</Text>
      <Calendar
        onDayPress={(day: DateData) => setDate(day.dateString)}
        markedDates={date ? { [date]: { selected: true, selectedColor: '#2E86AB' } } : {}}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2E86AB" />
      ) : (
        <>
          <Text style={{ marginTop: 10 }}>Selecione o horário:</Text>
          <FlatList
            data={horarios}
            renderItem={renderHorario}
            keyExtractor={(item) => item.hora}
            horizontal
          />
        </>
      )}

      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirmar Agendamento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  servicoItem: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  servicoNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  servicoPreco: {
    fontSize: 14,
    color: '#333',
  },
  servicoDuracao: {
    fontSize: 12,
    color: '#666',
  },
  card: {
    padding: 10,
    margin: 5,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  selected: {
    borderColor: '#2E86AB',
    borderWidth: 2,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    marginTop: 15,
    backgroundColor: '#2E86AB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
