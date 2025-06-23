import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
  RefreshControl, Modal, TextInput
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../routes/routes';
import {
  listarMeusAgendamentos, cancelarAgendamento, atualizarInformacoesCarro, IAgendamento
} from '../api/api';
import { useAlert } from '../components/AlertContext';
import { MaterialIcons } from '@expo/vector-icons';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { useAuth } from '../contexts/AuthContext';
import { cancelAppointmentNotification, requestNotificationPermissions } from '../utils/notificationService';

// Definir MeusAgRoute corretamente para uso com useRoute
type MeusAgRoute = RouteProp<RootStackParamList, 'MeusAgendamentos'>;
type MeusAgNav = StackNavigationProp<RootStackParamList, 'MeusAgendamentos'>;


export default function MeusAgendamentosScreen() {
  const navigation = useNavigation<MeusAgNav>();
  const route = useRoute<MeusAgRoute>(); // Usar RouteProp aqui
  const [agendamentos, setAgendamentos] = useState<IAgendamento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { showAlert } = useAlert();
  const { token } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [carroNome, setCarroNome] = useState('');
  const [carroModelo, setCarroModelo] = useState('');
  const [carroPlaca, setCarroPlaca] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<IAgendamento | null>(null);

  const loadAgendamentos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarMeusAgendamentos();
      setAgendamentos(data);

      // Verificação explícita e atribuição a uma constante local
      if (route.params && route.params.newAppointmentId) {
        const newAppointmentIdParam = route.params.newAppointmentId; // Garante que não é undefined
        const newAgendamento = data.find(
          (a) => a.id === newAppointmentIdParam
        );
        if (newAgendamento) {
          abrirModal(newAgendamento);
        }
        navigation.setParams({ newAppointmentId: undefined });
      }
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar os agendamentos', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, route.params?.newAppointmentId, showAlert]);

  useFocusEffect(
    useCallback(() => {
      requestNotificationPermissions();
      loadAgendamentos();
      return () => {
        // Opcional: limpeza se necessário ao desfocar
      };
    }, [loadAgendamentos])
  );


  const handleCancel = async (id: number) => {
    const agendamento = agendamentos.find(a => a.id === id);
    if (!agendamento) return;

    const agora = new Date();
    const dataAgendamento = new Date(`${agendamento.data}T${agendamento.horario}`);

    if (dataAgendamento < agora) {
      showAlert('Erro', 'Não é possível cancelar um agendamento passado', 'error');
      return;
    }

    try {
      await cancelarAgendamento(id);
      await cancelAppointmentNotification(id);
      showAlert('Sucesso', 'Agendamento cancelado com sucesso', 'success');
      loadAgendamentos();
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
      loadAgendamentos();
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

          {/* Adiciona informações do carro ou botão para adicionar */}
          {item.carro_nome && item.carro_modelo && item.carro_placa ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="directions-car" size={16} color="#6C7A89" />
              <Text style={styles.infoText}>
                {item.carro_nome} - {item.carro_modelo} ({item.carro_placa})
              </Text>
            </View>
          ) : (
            // Apenas mostra o botão se o agendamento não estiver cancelado e não tiver info de carro
            item.status !== 'cancelado' && (
              <TouchableOpacity
                onPress={() => abrirModal(item)}
                style={styles.editCarButton}
              >
                <MaterialIcons name="add-circle-outline" size={18} color="#3A7CA5" />
                <Text style={styles.editCarButtonText}>Adicionar informações do veículo</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Botão de Cancelar */}
        {item.status !== 'cancelado' && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => handleCancel(item.id)}
              style={styles.cancelButton}
              activeOpacity={0.9}
            >
              <Text style={styles.cancelText}>Cancelar Agendamento</Text>
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
              loadAgendamentos();
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

      {/* Modal para Adicionar/Editar Informações do Veículo */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 15, color: '#2E4052' }}>
              Informações do Veículo
            </Text>

            <TextInput
              placeholder="Nome do carro (ex: Gol, Civic)"
              style={styles.input}
              value={carroNome}
              onChangeText={setCarroNome}
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Modelo (ex: Comfortline, EXL)"
              style={styles.input}
              value={carroModelo}
              onChangeText={setCarroModelo}
              placeholderTextColor="#999"
            />
            <TextInput
              placeholder="Placa (ex: ABC-1234)"
              style={styles.input}
              value={carroPlaca}
              onChangeText={setCarroPlaca}
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 15 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, styles.modalButtonCancel, { flex: 1 }]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={salvarInformacoesCarro}
                style={[styles.modalButton, styles.modalButtonSave, { flex: 1 }]}
              >
                <Text style={styles.modalButtonTextSave}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Botão flutuante para criar novo agendamento */}
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
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSave: {
    backgroundColor: '#3A7CA5',
  },
  modalButtonTextSave: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonCancel: {
    backgroundColor: '#E1E8ED',
    borderWidth: 1,
    borderColor: '#B1BEC9',
  },
  modalButtonTextCancel: {
    color: '#6C7A89',
    fontWeight: '600',
    fontSize: 16,
  },
  editCarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4F9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A8D2E6',
  },
  editCarButtonText: {
    color: '#3A7CA5',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
});
