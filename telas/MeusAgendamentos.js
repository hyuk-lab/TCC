import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { listarMeusAgendamentos, cancelarAgendamento } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function MeusAgendamentosScreen() {
  const navigation = useNavigation();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const data = await listarMeusAgendamentos();
      setAgendamentos(data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      carregarAgendamentos();
    });
    return unsubscribe;
  }, [navigation]);

  const handleCancelar = async (id) => {
    try {
      await cancelarAgendamento(id);
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
    }
  };

  const renderAgendamento = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.servico}>{item.servico_nome}</Text>
      <Text style={styles.data}>Data: {item.data} às {item.horario.slice(0,5)}</Text>
      <Text style={styles.preco}>Preço: R$ {Number(item.servico_preco || 0).toFixed(2).replace('.', ',')}</Text>
      <Text style={[styles.status, item.status === 'cancelado' && styles.statusCancelado]}>
        {item.status.toUpperCase()}
      </Text>

      {item.status !== 'cancelado' && (
        <TouchableOpacity
          style={styles.cancelarBtn}
          onPress={() => handleCancelar(item.id)}
        >
          <Text style={styles.cancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus Agendamentos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2E86AB" />
      ) : (
        <FlatList
          data={agendamentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAgendamento}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum agendamento encontrado</Text>}
        />
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 16,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2
  },
  servico: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E86AB'
  },
  data: {
    marginTop: 5,
    color: '#555'
  },
  preco: {
    marginTop: 5,
    fontWeight: 'bold',
    color: '#333'
  },
  status: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  statusCancelado: {
    color: '#D32F2F'
  },
  cancelarBtn: {
    marginTop: 10,
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 5
  },
  cancelarTexto: {
    color: '#fff',
    textAlign: 'center'
  },
  empty: {
    textAlign: 'center',
    color: '#777',
    marginTop: 50
  }
});
