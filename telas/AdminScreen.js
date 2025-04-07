import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert 
} from 'react-native';
import { 
  listarAgendamentosAdmin, 
  atualizarStatusAgendamento 
} from '../services/api';

export default function AdminHome({ navigation, route }) {
  // Estados do componente
  const [agendamentos, setAgendamentos] = useState([]);
  const [recarregando, setRecarregando] = useState(false);
  
  // Carrega os agendamentos ao iniciar
  useEffect(() => {
    carregarAgendamentos();
  }, []);

  // Função para buscar agendamentos
  const carregarAgendamentos = async () => {
    try {
      setRecarregando(true);
      const dados = await listarAgendamentosAdmin();
      setAgendamentos(dados);
    } catch (erro) {
      Alert.alert('Erro', 'Não foi possível carregar os agendamentos');
      console.error('Erro ao carregar agendamentos:', erro);
    } finally {
      setRecarregando(false);
    }
  };

  // Função para atualizar status
  const atualizarStatus = async (id, status) => {
    try {
      await atualizarStatusAgendamento(id, status);
      Alert.alert('Sucesso', `Status alterado para ${status}`);
      carregarAgendamentos(); // Recarrega a lista após atualização
    } catch (erro) {
      Alert.alert('Erro', 'Falha ao atualizar status');
      console.error('Erro ao atualizar status:', erro);
    }
  };

  // Função para fazer logout
  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  return (
    <View style={styles.container}>
      {/* Header com título e botão de logout */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Painel Administrativo</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de agendamentos */}
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
            <Text style={[
              styles.status,
              item.status === 'confirmado' && styles.confirmado,
              item.status === 'cancelado' && styles.cancelado,
              item.status === 'pendente' && styles.pendente
            ]}>
              {item.status}
            </Text>

            {/* Botões de ação */}
            <View style={styles.botoes}>
              <TouchableOpacity
                style={[
                  styles.botaoAcao, 
                  styles.confirmar,
                  item.status === 'confirmado' && styles.botaoDesabilitado
                ]}
                onPress={() => atualizarStatus(item.id, 'confirmado')}
                disabled={item.status === 'confirmado'}
              >
                <Text style={styles.textoBotao}>Confirmar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.botaoAcao, 
                  styles.cancelar,
                  item.status === 'cancelado' && styles.botaoDesabilitado
                ]}
                onPress={() => atualizarStatus(item.id, 'cancelado')}
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

// Estilos atualizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E86AB'
  },
  logoutText: {
    color: '#F44336',
    fontWeight: 'bold'
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
    fontSize: 16,
    marginBottom: 5
  },
  data: {
    color: '#666',
    marginBottom: 5
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 10
  },
  pendente: {
    color: '#FF9800'
  },
  confirmado: {
    color: '#4CAF50'
  },
  cancelado: {
    color: '#F44336'
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  botaoAcao: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5
  },
  confirmar: {
    backgroundColor: '#E8F5E9'
  },
  cancelar: {
    backgroundColor: '#FFEBEE'
  },
  botaoDesabilitado: {
    opacity: 0.5
  },
  textoBotao: {
    fontWeight: 'bold'
  }
});