// ------------ CadastroScreen.tsx ------------
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/routes';
import { criarUsuario } from '../services/api';

type CadastroNav = StackNavigationProp<RootStackParamList, 'Cadastro'>;

export default function CadastroScreen({ navigation }: { navigation: CadastroNav }) {
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCadastro = async () => {
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'Senhas não coincidem');
      return;
    }
    try {
      setLoading(true);
      await criarUsuario({ nome, email, senha, telefone });
      Alert.alert('Sucesso', 'Cadastro realizado!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style= { styles.container } >
    <TextInput style={ styles.input } placeholder = "Nome Completo" value = { nome } onChangeText = { setNome } />
      <TextInput style={ styles.input } placeholder = "Email" keyboardType = "email-address" value = { email } onChangeText = { setEmail } />
        <TextInput style={ styles.input } placeholder = "Telefone" keyboardType = "phone-pad" value = { telefone } onChangeText = { setTelefone } />
          <TextInput style={ styles.input } placeholder = "Senha" secureTextEntry value = { senha } onChangeText = { setSenha } />
            <TextInput style={ styles.input } placeholder = "Confirmar Senha" secureTextEntry value = { confirmarSenha } onChangeText = { setConfirmarSenha } />
              <TouchableOpacity style={ styles.button } onPress = { handleCadastro } disabled = { loading } >
                <Text style={ styles.buttonText }> { loading? 'Cadastrando...': 'Cadastrar' } </Text>
                  </TouchableOpacity>
                  < TouchableOpacity onPress = {() => navigation.navigate('Login')
}>
  <Text style={ styles.link }>
    Já tem conta ? Faça login
      </Text>
      </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 15, backgroundColor: '#fff' },
  button: { height: 50, backgroundColor: '#2E86AB', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#2E86AB', marginTop: 20, textAlign: 'center' },
});
