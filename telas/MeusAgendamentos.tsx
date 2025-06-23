import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
  RefreshControl, Modal, TextInput
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../routes/routes';
import {
  listarMeusAgendamentos, cancelarAgendamento, atualizarInformacoesCarro, IAgendamento
} from '../api/api';
import { useAlert } from '../components/AlertContext';
import { MaterialIcons } from '@expo/vector-icons';
import { FloatingActionButton } from '../components/FloatingActionButton';

type MeusAgNav = StackNavigationProp<RootStackParamList, 'MeusAgendamentos'>;

export default function MeusAgendamentosScreen() {
  const navigation = useNavigation<MeusAgNav>();
  const [agendamentos, setAgendamentos] = useState<IAgendamento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { showAlert } = useAlert();

  const [modalVisible, setModalVisible] = useState(false);
  const [carroNome, setCarroNome] = useState('');
  const [carroModelo, setCarroModelo] = useState('');
  const [carroPlaca, setCarroPlaca] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<IAgendamento | null>(null);
  const [showCarModal, setShowCarModal] = useState(false);
  const [newAgendamentoId, setNewAgendamentoId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listarMeusAgendamentos();
      setAgendamentos(data);

      // Verifica se há agendamentos recentes sem informações de carro
      const recenteSemCarro = data.find(a =>
        !a.carro_nome && new Date(a.data) > new Date() && a.status !== 'cancelado'
      );
      if (recenteSemCarro) {
        setNewAgendamentoId(recenteSemCarro.id);
        setShowCarModal(true);
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar os agendamentos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const handleCancel = async (id: number) => {
    try {
      await cancelarAgendamento(id);
      showAlert('Sucesso', 'Agendamento cancelado com sucesso', 'success');
      load();
    } catch (error) {
      showAlert('Erro', 'Não foi possível cancelar o agendamento', 'error');
    }
  };

  const abrirModal = (agendamento: IAgendamento) => {
    setAgendamentoSelecionado(agendamento);
    setCarroNome(agendamento.carro_nome || '');
    setCarroModelo(agendamento.carro_modelo || '');
    setCarroPlaca(agendamento.carro_placa || '');
    setModalVisible(true);
  };

  const salvarInformacoesCarro = async () => {
    if (!agendamentoSelecionado) return;

    try {
      await atualizarInformacoesCarro(agendamentoSelecionado.id, {
        carro_nome: carroNome,
        carro_modelo: carroModelo,
        carro_placa: carroPlaca,
      });
      showAlert('Sucesso', 'Informações do veículo atualizadas!', 'success');
      setModalVisible(false);
      load();
    } catch (error) {
      showAlert('Erro', 'Não foi possível atualizar as informações do veículo', 'error');
    }
  };

  const renderItem = ({ item }: { item: IAgendamento }) => {
    const precoNum = typeof item.servico_preco === 'number' ? item.servico_preco : parseFloat(item.servico_preco as any) || 0;
    const precoTexto = `R$ ${precoNum.toFixed(2).replace('.', ',')}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.servico}>{item.servico_nome}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'cancelado' && styles.statusCancelado,
            item.status === 'confirmado' && styles.statusConfirmado,
            item.status === 'pendente' && styles.statusPendente,
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={16} color="#6C7A89" />
            <Text style={styles.infoText}>{item.data} • {item.horario}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="attach-money" size={16} color="#6C7A89" />
            <Text style={styles.infoText}>{precoTexto}</Text>
          </View>

          {item.carro_nome && (
            <View style={styles.infoRow}>
              <MaterialIcons name="directions-car" size={16} color="#6C7A89" />
              <Text style={styles.infoText}>
                {item.carro_nome} - {item.carro_modelo} ({item.carro_placa})
              </Text>
            </View>
          )}
        </View>

        {item.status !== 'cancelado' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => abrirModal(item)}
              style={[styles.cancelButton, { backgroundColor: '#E3F2FD' }]}
              activeOpacity={0.9}
            >
              <Text style={[styles.cancelText, { color: '#2E86AB' }]}>
                {item.carro_nome ? 'Editar veículo' : 'Adicionar veículo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleCancel(item.id)}
              style={styles.cancelButton}
              activeOpacity={0.9}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={agendamentos}
        keyExtractor={(i) => i.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={['#2E86AB']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={48} color="#B1BEC9" />
            <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
            <Text style={styles.emptyMessage}>
              Você ainda não possui agendamentos marcados
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
              Informações do Veículo
            </Text>

            <TextInput
              placeholder="Nome do carro"
              style={styles.input}
              value={carroNome}
              onChangeText={setCarroNome}
            />
            <TextInput
              placeholder="Modelo"
              style={styles.input}
              value={carroModelo}
              onChangeText={setCarroModelo}
            />
            <TextInput
              placeholder="Placa"
              style={styles.input}
              value={carroPlaca}
              onChangeText={setCarroPlaca}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.cancelButton, { flex: 1 }]}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={salvarInformacoesCarro}
                style={[styles.cancelButton, { flex: 1, backgroundColor: '#2E86AB' }]}
              >
                <Text style={[styles.cancelText, { color: '#fff' }]}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
              Adicionar Veículo
            </Text>
            <Text style={{ marginBottom: 15 }}>
              Por favor, adicione as informações do seu veículo para este agendamento.
            </Text>

            <TextInput
              placeholder="Nome do carro"
              style={styles.input}
              value={carroNome}
              onChangeText={setCarroNome}
            />
            <TextInput
              placeholder="Modelo"
              style={styles.input}
              value={carroModelo}
              onChangeText={setCarroModelo}
            />
            <TextInput
              placeholder="Placa"
              style={styles.input}
              value={carroPlaca}
              onChangeText={setCarroPlaca}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowCarModal(false)}
                style={[styles.cancelButton, { flex: 1 }]}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (newAgendamentoId) {
                    abrirModal(agendamentos.find(a => a.id === newAgendamentoId)!);
                    setShowCarModal(false);
                  }
                }}
                style={[styles.cancelButton, { flex: 1, backgroundColor: '#2E86AB' }]}
              >
                <Text style={[styles.cancelText, { color: '#fff' }]}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FloatingActionButton
        onPress={() => navigation.navigate('Agendamento')}
        iconName="add"
        iconColor="#fff"
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FC',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FC',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#3A7CA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  servico: {
    fontWeight: '600',
    fontSize: 16,
    color: '#2E4052',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusConfirmado: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  statusPendente: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFC107',
    borderWidth: 1,
  },
  statusCancelado: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6C7A89',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E4052',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6C7A89',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: '85%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
});