import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { listarMeusAgendamentos, cancelarAgendamento, carregarAgendamentos } from '../services/api';



export default function MeusAgendamentos({ route }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [recarregando, setRecarregando] = useState(false);
  const navigation = useNavigation();
  const usuario = route?.params?.usuario;

  const carregarAgendamentos = async () => {
    try {
      const agendamentos = await listarMeusAgendamentos();
      setAgendamentos(agendamentos);
    } catch (error) {
      // Trate o erro
    }
  };

  const handleCancelar = async (id) => {
    try {
      await cancelarAgendamento(id);
      carregarAgendamentos();
      Alert.alert('Sucesso', 'Agendamento cancelado');
    } catch (erro) {
      Alert.alert('Erro', 'Falha ao cancelar agendamento');
    }
  };

  useEffect(() => {
    if (usuario) {
      carregarAgendamentos();
    } else {
      Alert.alert('Erro', 'Usuário não encontrado');
      navigation.navigate('Login');
    }

    const unsubscribe = navigation.addListener('focus', carregarAgendamentos);
    return unsubscribe;
  }, [navigation, usuario]);

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
              <MaterialIcons 
                name="car-wash" 
                size={24} 
                color="#2E86AB" 
              />
              <Text style={styles.servico}>{item.servico.toUpperCase()}</Text>
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
            </View>

            {item.status === 'pendente' && (
              <TouchableOpacity 
                style={styles.botaoCancelar}
                onPress={() => handleCancelar(item.id)}
              >
                <Text style={styles.textoBotao}>CANCELAR</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVazia}>Nenhum agendamento encontrado</Text>
        }
      />

      <TouchableOpacity 
        style={styles.botaoNovo}
        onPress={() => navigation.navigate('Agendamento', { usuario })}
      >
        <MaterialIcons name="add" size={24} color="white" />
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
    color: '#555'
  },
  botaoCancelar: {
    marginTop: 10,
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  textoBotao: {
    color: '#E53935',
    fontWeight: 'bold'
  },
  listaVazia: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777'
  },
  botaoNovo: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#2E86AB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  }
});
