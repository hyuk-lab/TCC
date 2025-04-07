import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { buscarHorariosDoDia, criarAgendamento, listarServicos } from '../services/api';

export default function AgendamentoScreen() {
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date());
  const [horarios, setHorarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [servicosData, horariosData] = await Promise.all([
          listarServicos(),
          buscarHorariosDoDia(date.toISOString().split('T')[0])
        ]);
        setServicos(servicosData);
        setHorarios(horariosData);
      } catch (erro) {
        Alert.alert('Erro', 'Falha ao carregar dados');
      }
    };
    carregarDados();
  }, [date]);

  const handleAgendar = async () => {
    if (!horarioSelecionado || !servicoSelecionado) {
      Alert.alert('Atenção', 'Selecione um horário e serviço!');
      return;
    }

    try {
      await criarAgendamento({
        data: date.toISOString().split('T')[0],
        horario: horarioSelecionado,
        servico_id: servicoSelecionado.id
      });
      Alert.alert('Sucesso', 'Agendamento confirmado!');
      navigation.goBack();
    } catch (erro) {
      Alert.alert('Erro', erro.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AGENDAMENTO</Text>
      
      <Calendar
        current={date.toISOString().split('T')[0]}
        minDate={new Date().toISOString().split('T')[0]}
        onDayPress={(day) => setDate(new Date(day.dateString))}
        markedDates={{
          [date.toISOString().split('T')[0]]: {
            selected: true,
            selectedColor: '#2E86AB'
          }
        }}
        theme={{
          calendarBackground: '#fff',
          selectedDayBackgroundColor: '#2E86AB',
          todayTextColor: '#2E86AB',
          dayTextColor: '#333',
          monthTextColor: '#2E86AB',
          textDisabledColor: '#d9d9d9',
        }}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HORÁRIOS DISPONÍVEIS</Text>
        <FlatList
          horizontal
          data={horarios}
          keyExtractor={(item) => item.hora}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.horarioBtn,
                horarioSelecionado === item.hora && styles.horarioSelecionado,
                item.status === 'ocupado' && styles.horarioOcupado
              ]}
              onPress={() => item.status === 'disponivel' && setHorarioSelecionado(item.hora)}
              disabled={item.status === 'ocupado'}
            >
              <Text style={styles.horarioText}>{item.hora}</Text>
              <Text style={styles.horarioStatus}>
                {item.status === 'disponivel' ? 'Disponível' : 'Ocupado'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SERVIÇOS</Text>
        <FlatList
          horizontal
          data={servicos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.servicoBtn,
                servicoSelecionado?.id === item.id && styles.servicoSelecionado
              ]}
              onPress={() => setServicoSelecionado(item)}
            >
              <Text style={styles.servicoNome}>{item.nome}</Text>
              <Text style={styles.servicoPreco}>R$ {item.preco.toFixed(2)}</Text>
              <Text style={styles.servicoDuracao}>{item.duracao}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.confirmarBtn}
        onPress={handleAgendar}
        disabled={!horarioSelecionado || !servicoSelecionado}
      >
        <Text style={styles.confirmarTexto}>CONFIRMAR AGENDAMENTO</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  horarioBtn: {
    width: 100,
    padding: 12,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    elevation: 2,
  },
  horarioSelecionado: {
    borderWidth: 2,
    borderColor: '#2E86AB',
  },
  horarioOcupado: {
    backgroundColor: '#FFEBEE',
  },
  horarioText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  horarioStatus: {
    fontSize: 12,
    color: '#666',
  },
  servicoBtn: {
    width: 150,
    padding: 15,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  servicoSelecionado: {
    borderWidth: 2,
    borderColor: '#2E86AB',
  },
  servicoNome: {
    fontWeight: '600',
    marginBottom: 5,
  },
  servicoPreco: {
    color: '#2E86AB',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  servicoDuracao: {
    fontSize: 12,
    color: '#666',
  },
  confirmarBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});