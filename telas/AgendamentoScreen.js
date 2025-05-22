import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { buscarHorariosDisponiveis, criarAgendamento, listarServicos } from '../services/api';

export default function AgendamentoScreen() {
  const navigation = useNavigation();
  const [date, setDate] = useState(new Date());
  const [horarios, setHorarios] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);
        const dataFormatada = date.toISOString().split('T')[0];

        const [servicosData, horariosData] = await Promise.all([
          listarServicos(),
          buscarHorariosDisponiveis(dataFormatada)
        ]);

        const servicosValidados = servicosData.map(servico => ({
          id: servico.id || 0,
          nome: servico.nome || 'Serviço sem nome',
          preco: servico.preco ? parseFloat(servico.preco) : 0,
          duracao: servico.duracao || '00:00'
        }));

        setServicos(servicosValidados);
        setHorarios(horariosData);
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        setError('Falha ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
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
      setLoading(true);
      const dataFormatada = date.toISOString().split('T')[0];

      await criarAgendamento({
        data: dataFormatada,
        horario: horarioSelecionado,
        servico_id: servicoSelecionado.id
      });

      Alert.alert('Sucesso', 'Agendamento confirmado!', [
        { text: 'OK', onPress: () => navigation.navigate('MeusAgendamentos') }
      ]);
    } catch (erro) {
      console.error('Erro ao agendar:', erro);
      Alert.alert('Erro', erro.message || 'Falha ao confirmar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const renderHorario = ({ item }) => (
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
  );

  const renderServico = ({ item }) => {
    const precoFormatado = item.preco?.toFixed ? item.preco.toFixed(2) : '0.00';

    return (
      <TouchableOpacity
        style={[
          styles.servicoBtn,
          servicoSelecionado?.id === item.id && styles.servicoSelecionado
        ]}
        onPress={() => setServicoSelecionado(item)}
      >
        <Text style={styles.servicoNome}>{item.nome}</Text>
        <Text style={styles.servicoPreco}>R$ {precoFormatado.replace('.', ',')}</Text>
        <Text style={styles.servicoDuracao}>{item.duracao}</Text>
      </TouchableOpacity>
    );
  };

  if (loading && !horarios.length && !servicos.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#2E86AB" />
        </TouchableOpacity>
        <Text style={styles.header}>Novo Agendamento</Text>
        <View style={{ width: 24 }} />
      </View>

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

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setDate(new Date(date.getTime()));
              setError(null);
            }}
          >
            <Text style={styles.retryText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HORÁRIOS DISPONÍVEIS</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#2E86AB" />
        ) : (
          <FlatList
            horizontal
            data={horarios}
            keyExtractor={(item) => item.hora}
            renderItem={renderHorario}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum horário disponível</Text>
            }
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SERVIÇOS</Text>
        <FlatList
          horizontal
          data={servicos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderServico}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum serviço disponível</Text>
          }
        />
      </View>

      <TouchableOpacity
        style={[
          styles.confirmarBtn,
          (!horarioSelecionado || !servicoSelecionado || loading) && styles.buttonDisabled
        ]}
        onPress={handleAgendar}
        disabled={!horarioSelecionado || !servicoSelecionado || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmarTexto}>CONFIRMAR AGENDAMENTO</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E86AB',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  confirmarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#2E86AB',
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 10,
  },
});