import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { buscarHorariosDisponiveis, criarAgendamento } from '../services/api';
import { criarAgendamento } from '../services/api';


export default function Agendamento({ route, navigation }) {
  const [data, setData] = useState(new Date());
  const [mostrarSeletor, setMostrarSeletor] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const { usuario } = route.params;

  const buscarHorarios = async (dataSelecionada) => {
    try {
      const disponiveis = await buscarHorariosDisponiveis(dataSelecionada);
      setHorarios(disponiveis);
    } catch (erro) {
      Alert.alert('Erro', 'Falha ao buscar horários');
    }
  };

  const handleAgendar = async () => {
    try {
      await criarAgendamento({
        usuarioId: usuario.id,
        servico_id: 1, // Você pode adicionar um seletor de serviços
        data: data.toISOString().split('T')[0],
        horario: horarioSelecionado
      });
      Alert.alert('Sucesso', 'Agendamento criado!');
      navigation.goBack();
    } catch (erro) {
      Alert.alert('Erro', 'Falha ao criar agendamento');
    }
  };

  useEffect(() => {
    buscarHorarios(data);
  }, [data]);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Novo Agendamento</Text>

      <TouchableOpacity 
        style={styles.botaoData}
        onPress={() => setMostrarSeletor(true)}
      >
        <Text>Selecionar Data: {data.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {mostrarSeletor && (
       <DatePickerModal
       locale="pt-BR"
       mode="single"
       visible={showDatePicker}
       onDismiss={() => setShowDatePicker(false)}
       date={data}
       onConfirm={({ date }) => setData(date)}
     />
      )}

      <Text style={styles.subtitulo}>Horarios Disponiveis:</Text>

      <FlatList
        data={horarios}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemHorario,
              horarioSelecionado === item && styles.itemSelecionado
            ]}
            onPress={() => setHorarioSelecionado(item)}
          >
            <Text style={horarioSelecionado === item ? styles.textoSelecionado : styles.textoHorario}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        numColumns={2}
        contentContainerStyle={styles.listaHorarios}
      />

      <TouchableOpacity
        style={[
          styles.botaoConfirmar,
          !horarioSelecionado && styles.botaoDesabilitado
        ]}
        onPress={handleAgendar}
        disabled={!horarioSelecionado}
      >
        <Text style={styles.textoBotao}>Confirmar Agendamento</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos similares ao anterior (omitidos por brevidade)