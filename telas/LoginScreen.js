import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { fazerLogin } from '../services/api';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async () => {
    try {
      setCarregando(true);
      const usuario = await fazerLogin(email, senha);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'MeusAgendamentos', params: { usuario } }]
      });
      
    } catch (erro) {
      Alert.alert('Erro', erro.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>CleanWay</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity 
        style={styles.botao} 
        onPress={handleLogin}
        disabled={carregando}
      >
        <Text style={styles.textoBotao}>
          {carregando ? 'Carregando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.link}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff'
  },
  botao: {
    height: 50,
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  link: {
    color: '#2E86AB',
    marginTop: 20,
    textAlign: 'center'
  }
});