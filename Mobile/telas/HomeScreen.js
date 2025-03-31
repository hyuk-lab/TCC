import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  // Dados simulados de agendamentos
  const agendamentos = [
    { id: 1, data: '15/10/2023', horario: '09:00', status: 'Confirmado' },
    { id: 2, data: '17/10/2023', horario: '14:30', status: 'Pendente' },
  ];

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Agendamentos</Text>
      </View>
    <text>ewqewqeqw</text>
      {/* Lista de Agendamentos */}
      <ScrollView style={styles.list}>
        {agendamentos.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            onPress={() => navigation.navigate('Detalhes', { agendamento: item })}
          >
            <Text style={styles.cardDate}>{item.data} ? {item.horario}</Text>
            <Text style={[
              styles.cardStatus,
              item.status === 'Confirmado' ? styles.statusConfirmed : styles.statusPending
            ]}>
              {item.status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botão de Novo Agendamento */}
      <TouchableOpacity 
        style={styles.newButton}
        onPress={() => navigation.navigate('Agendamento')}
      >
        <Text style={styles.newButtonText}>+ Novo Agendamento</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#2E86AB',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardStatus: {
    marginTop: 5,
    fontSize: 14,
  },
  statusConfirmed: {
    color: '#4CAF50', // Verde para confirmado
  },
  statusPending: {
    color: '#FF9800', // Laranja para pendente
  },
  newButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2E86AB',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});