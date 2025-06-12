// ------------ MeusAgendamentos.tsx ------------
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as AppRoutes from '../routes/routes';
import { listarMeusAgendamentos, cancelarAgendamento, IAgendamento } from '../services/api';

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
    <View style= { styles.card } >
    <Text style={ styles.servico }> { item.servico_nome } </Text>
      < Text > Data: { item.data } às { item.horario } </Text>
        < Text > Preço: R$ { item.servico_preco.toFixed(2).replace('.', ',') } </Text>
          < Text > Status: { item.status.toUpperCase() } </Text>
  {
    item.status !== 'cancelado' && (
      <TouchableOpacity onPress={ () => handleCancel(item.id) } style = { styles.cancelButton } >
        <Text style={ styles.cancelText }> Cancelar </Text>
          </TouchableOpacity>
      )
  }
  </View>
  );

  return (
    <View style= { styles.container } >
    { loading?<ActivityIndicator size = "large" color = "#2E86AB" /> : (
      <FlatList
          data= { agendamentos }
  keyExtractor = {(i) => i.id.toString()
}
renderItem = { renderItem }
ListEmptyComponent = {< Text > Nenhum agendamento encontrado </Text>}
        />
      )}
</View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8F9FA' },
  card: { backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 8 },
  servico: { fontWeight: 'bold', fontSize: 16, color: '#2E86AB' },
  cancelButton: { marginTop: 8, backgroundColor: '#D32F2F', padding: 10, borderRadius: 5 },
  cancelText: { color: '#fff', textAlign: 'center' },
});