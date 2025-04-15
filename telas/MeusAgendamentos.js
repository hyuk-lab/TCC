import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { 
  listarMeusAgendamentos, 
  cancelarAgendamento,
  buscarHorariosDisponiveis,
  listarServicos,
  alterarAgendamento
} from '../services/api';
import { Calendar } from 'react-native-calendars';
import { MaterialIcons } from '@expo/vector-icons';

export default function MeusAgendamentos({ route }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [recarregando, setRecarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [novoHorario, setNovoHorario] = useState('');
  const [novoServico, setNovoServico] = useState('');

  // Carrega agendamentos do usuário
  const carregarAgendamentos = async () => {
    try {
      setRecarregando(true);
      const dados = await listarMeusAgendamentos();
      setAgendamentos(dados);
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Falha ao carregar agendamentos');
    } finally {
      setRecarregando(false);
    }
  };

  // Carrega serviços disponíveis
  const carregarServicos = async () => {
    try {
      const dados = await listarServicos();
      setServicos(dados);
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Falha ao carregar serviços');
    }
  };

  // Carrega horários disponíveis para uma data
  const carregarHorariosDisponiveis = async (data) => {
    try {
      const dados = await buscarHorariosDisponiveis(data);
      setHorariosDisponiveis(dados);
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Falha ao carregar horários');
    }
  };

  // Abre modal para edição
  const abrirModalEdicao = async (agendamento) => {
    setAgendamentoEditando(agendamento);
    setNovoHorario(agendamento.horario);
    setNovoServico(agendamento.servico_id);
    await carregarHorariosDisponiveis(agendamento.data);
    await carregarServicos();
    setModalVisivel(true);
  };

  // Salva alterações no agendamento
  const salvarAlteracoes = async () => {
    try {
      if (!agendamentoEditando) return;
      
      await alterarAgendamento(agendamentoEditando.id, {
        horario: novoHorario,
        servico_id: novoServico
      });
      
      Alert.alert('Sucesso', 'Agendamento atualizado!');
      setModalVisivel(false);
      carregarAgendamentos();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Falha ao atualizar agendamento');
    }
  };

  // Cancela agendamento
  const cancelarAgendamento = async (id) => {
    try {
      await cancelarAgendamento(id);
      Alert.alert('Sucesso', 'Agendamento cancelado!');
      carregarAgendamentos();
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Falha ao cancelar agendamento');
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>MEUS AGENDAMENTOS</Text>

      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={carregarAgendamentos}
            colors={['#2E86AB']}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="event" size={24} color="#2E86AB" />
              <Text style={styles.servico}>{item.servico_nome}</Text>
              <View style={[
                styles.statusBadge,
                item.status === 'cancelado' && styles.statusCancelado,
                item.status === 'confirmado' && styles.statusConfirmado
              ]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.data}>
                <MaterialIcons name="calendar-today" size={16} /> {item.data}
              </Text>
              <Text style={styles.horario}>
                <MaterialIcons name="access-time" size={16} /> {item.horario}
              </Text>
              <Text style={styles.preco}>
                R$ {item.servico_preco.toFixed(2)}
              </Text>
            </View>

            {item.status === 'pendente' && (
              <View style={styles.botoesAcao}>
                <TouchableOpacity 
                  style={styles.botaoEditar}
                  onPress={() => abrirModalEdicao(item)}
                >
                  <Text style={styles.textoBotao}>ALTERAR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.botaoCancelar}
                  onPress={() => cancelarAgendamento(item.id)}
                >
                  <Text style={styles.textoBotao}>CANCELAR</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVazia}>Nenhum agendamento encontrado</Text>
        }
      />

      {/* Modal de Edição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Editar Agendamento</Text>
            
            <Text style={styles.modalSubtitulo}>Serviço:</Text>
            <ScrollView horizontal style={styles.servicosContainer}>
              {servicos.map(servico => (
                <TouchableOpacity
                  key={servico.id}
                  style={[
                    styles.servicoItem,
                    novoServico === servico.id && styles.servicoSelecionado
                  ]}
                  onPress={() => setNovoServico(servico.id)}
                >
                  <Text>{servico.nome}</Text>
                  <Text>R$ {servico.preco.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.modalSubtitulo}>Horário:</Text>
            <ScrollView horizontal style={styles.horariosContainer}>
              {horariosDisponiveis.map(horario => (
                <TouchableOpacity
                  key={horario}
                  style={[
                    styles.horarioItem,
                    novoHorario === horario && styles.horarioSelecionado
                  ]}
                  onPress={() => setNovoHorario(horario)}
                >
                  <Text>{horario}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalBotoes}>
              <TouchableOpacity 
                style={styles.botaoCancelar}
                onPress={() => setModalVisivel(false)}
              >
                <Text style={styles.textoBotao}>CANCELAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.botaoConfirmar}
                onPress={salvarAlteracoes}
              >
                <Text style={styles.textoBotao}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FA'
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10
  },
  servico: {
    flex: 1,
    marginLeft: 10,
    fontWeight: '600',
    color: '#333'
  },
  statusBadge: {
    backgroundColor: '#FFECB3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusConfirmado: {
    backgroundColor: '#C8E6C9'
  },
  statusCancelado: {
    backgroundColor: '#FFCDD2'
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500'
  },
  cardBody: {
    marginVertical: 8
  },
  data: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5
  },
  horario: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5
  },
  preco: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: 'bold'
  },
  botoesAcao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  botaoEditar: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 5
  },
  botaoCancelar: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 5
  },
  textoBotao: {
    fontWeight: 'bold'
  },
  listaVazia: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2E86AB'
  },
  modalSubtitulo: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5
  },
  servicosContainer: {
    marginBottom: 15
  },
  servicoItem: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5
  },
  servicoSelecionado: {
    borderColor: '#2E86AB',
    backgroundColor: '#E3F2FD'
  },
  horariosContainer: {
    marginBottom: 15
  },
  horarioItem: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5
  },
  horarioSelecionado: {
    borderColor: '#2E86AB',
    backgroundColor: '#E3F2FD'
  },
  modalBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15
  },
  botaoConfirmar: {
    flex: 1,
    backgroundColor: '#2E86AB',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 5
  }
});