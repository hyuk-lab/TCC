import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as AppRoutes from '../routes/routes';
import { listarMeusAgendamentos, cancelarAgendamento, IAgendamento } from '../api/api';
import { useAlert } from '../components/AlertContext';
import { MaterialIcons } from '@expo/vector-icons';

type MeusAgNav = StackNavigationProp<AppRoutes.RootStackParamList, 'MeusAgendamentos'>;

export default function MeusAgendamentosScreen({ navigation }: { navigation: MeusAgNav }) {
  const [agendamentos, setAgendamentos] = useState<IAgendamento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { showAlert } = useAlert();

  const load = async () => {
    try {
      setLoading(true);
      const data = await listarMeusAgendamentos();
      setAgendamentos(data);
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

  const renderItem = ({ item }: { item: IAgendamento }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.servico}>{item.servico_nome}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'cancelado' && styles.statusCancelado,
          item.status === 'confirmado' && styles.statusConfirmado,
          item.status === 'pendente' && styles.statusPendente
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
          <Text style={styles.infoText}>R$ {item.servico_preco.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>

      {item.status !== 'cancelado' && (
        <TouchableOpacity
          onPress={() => handleCancel(item.id)}
          style={styles.cancelButton}
          activeOpacity={0.9}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
            <Text style={styles.emptyMessage}>Você ainda não possui agendamentos marcados</Text>
          </View>
        }
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
});