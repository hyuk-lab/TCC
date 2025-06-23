import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/routes';
import { criarUsuario } from '../api/api';
import { useAlert } from '../components/AlertContext';

type CadastroNav = StackNavigationProp<RootStackParamList, 'Cadastro'>;

export default function CadastroScreen({ navigation }: { navigation: CadastroNav }) {
  const { showAlert } = useAlert();
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCadastro = async () => {
    if (!nome.trim()) {
      showAlert('Erro', 'Por favor, insira seu nome completo', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Erro', 'Por favor, insira um email válido', 'error');
      return;
    }

    if (telefone && telefone.length < 10) {
      showAlert('Erro', 'Telefone deve ter pelo menos 10 dígitos', 'error');
      return;
    }

    if (senha.length < 6) {
      showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    if (!/[A-Z]/.test(senha)) {
      showAlert('Erro', 'A senha deve conter pelo menos uma letra maiúscula', 'error');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
      showAlert('Erro', 'A senha deve conter pelo menos um caractere especial', 'error');
      return;
    }

    if (senha !== confirmarSenha) {
      showAlert('Erro', 'Senhas não coincidem', 'error');
      return;
    }

    try {
      setLoading(true);
      await criarUsuario({ nome, email, senha, telefone: telefone || undefined });
      showAlert('Sucesso', 'Cadastro realizado!', 'success');
      navigation.navigate('Login');
    } catch (e: any) {
      showAlert('Erro', e.response?.data?.error || 'Erro ao cadastrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        keyboardType="phone-pad"
        value={telefone}
        onChangeText={(text) => setTelefone(text.replace(/[^0-9]/g, ''))}
        maxLength={11}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirmar Senha"
        secureTextEntry
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCadastro}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>
          Já tem conta? <Text style={styles.linkHighlight}>Faça login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#B1BEC9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#2E86AB',
    textAlign: 'center',
    fontSize: 14,
  },
  linkHighlight: {
    fontWeight: '600',
  },
});