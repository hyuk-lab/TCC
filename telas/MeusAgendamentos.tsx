import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ImageBackground
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as AppRoutes from '../routes/routes';
import { listarMeusAgendamentos, cancelarAgendamento, IAgendamento } from '../api/api';

type MeusAgNav = StackNavigationProp<AppRoutes.RootStackParamList, 'MeusAgendamentos'>;

export default function MeusAgendamentosScreen({ navigation }: { navigation: MeusAgNav }) {
  const [agendamentos, setAgendamentos] = useState<IAgendamento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const load = async () => {
    setLoading(true);
    const data = await listarMeusAgendamentos();
    setAgendamentos(data);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  const handleCancel = async (id: number) => {
    await cancelarAgendamento(id);
    load();
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
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>DATA E HORA</Text>
          <Text style={styles.infoText}>{item.data} • {item.horario}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>VALOR</Text>
          <Text style={styles.infoText}>R$ {item.servico_preco.toFixed(2).replace('.', ',')}</Text>
        </View>
      </View>

      {item.status !== 'cancelado' && (
        <TouchableOpacity
          onPress={() => handleCancel(item.id)}
          style={styles.cancelButton}
          activeOpacity={0.9}
        >
          <Text style={styles.cancelText}>Cancelar Agendamento</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MEUS AGENDAMENTOS</Text>
        <Text style={styles.headerSubtitle}>Histórico de serviços agendados</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86AB" />
        </View>
      ) : (
        <FlatList
          data={agendamentos}
          keyExtractor={(i) => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIllustration}>
                <View style={styles.emptyCircle} />
                <View style={styles.emptyLine} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
              <Text style={styles.emptyMessage}>Você ainda não possui agendamentos marcados</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFD',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    backgroundColor: '#2E86AB',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2E86AB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardBody: {
    marginBottom: 15,
  },
  servico: {
    fontWeight: '700',
    fontSize: 18,
    color: '#2E3A59',
    flex: 1,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusConfirmado: {
    backgroundColor: '#E3F9E5',
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
  infoContainer: {
    marginBottom: 15,
  },
  infoLabel: {
    fontWeight: '700',
    color: '#7A8599',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 5,
    opacity: 0.8,
  },
  infoText: {
    fontSize: 16,
    color: '#2E3A59',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 10,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cancelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(46, 134, 171, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    position: 'relative',
  },
  emptyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(46, 134, 171, 0.2)',
  },
  emptyLine: {
    position: 'absolute',
    width: 90,
    height: 4,
    backgroundColor: 'rgba(46, 134, 171, 0.2)',
    transform: [{ rotate: '-45deg' }],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E3A59',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#7A8599',
    textAlign: 'center',
    lineHeight: 22,
  },
});