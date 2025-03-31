import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { listarAgendamentos, atualizarStatus } from '../services/api';

export default function AdminHome({ navigation }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [recarregando, setRecarregando] = useState(false);

  const carregarAgendamentos = async () => {
    try {
      setRecarregando(true);
      const dados = await listarAgendamentos();
      setAgendamentos(dados);
    } catch (erro) {
      console.error(erro);
    } finally {
      setRecarregando(false);
    }
  };

  const handleStatus = async (id, novoStatus) => {
    try {
      await atualizarStatus(id, novoStatus);
      carregarAgendamentos();
    } catch (erro) {
      console.error(erro);
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Painel Administrativo</Text>

      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={recarregando}
            onRefresh={carregarAgendamentos}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cliente}>{item.cliente}</Text>
            <Text style={styles.data}>{item.data} às {item.horario}</Text>
            <Text style={[styles.status, 
              item.status === 'confirmado' ? styles.confirmado :
              item.status === 'cancelado' ? styles.cancelado :
              styles.pendente
            ]}>
              {item.status}
            </Text>

            <View style={styles.botoes}>
              <TouchableOpacity
                style={[styles.botaoAcao, styles.confirmar]}
                onPress={() => handleStatus(item.id, 'confirmado')}
                disabled={item.status === 'confirmado'}
              >
                <Text style={styles.textoBotao}>Confirmar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoAcao, styles.cancelar]}
                onPress={() => handleStatus(item.id, 'cancelado')}
                disabled={item.status === 'cancelado'}
              >
                <Text style={styles.textoBotao}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5'
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2
  },
  cliente: {
    fontWeight: 'bold',
    fontSize: 16
  },
  data: {
    color: '#666',
    marginVertical: 5
  },
  status: {
    fontWeight: 'bold'
  },
  pendente: {
    color: '#FF9800' // Laranja
  },
  confirmado: {
    color: '#4CAF50' // Verde
  },
  cancelado: {
    color: '#F44336' // Vermelho
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  botaoAcao: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5
  },
  confirmar: {
    backgroundColor: '#E8F5E9' // Verde claro
  },
  cancelar: {
    backgroundColor: '#FFEBEE' // Vermelho claro
  },
  textoBotao: {
    fontWeight: 'bold'
  }
});