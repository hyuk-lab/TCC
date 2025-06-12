
// ------------ LoginScreen.tsx ------------
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/routes';
import { fazerLogin } from '../api/api';
type LoginNav = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: { navigation: LoginNav }) {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await fazerLogin(email, senha);
      navigation.reset({ index: 0, routes: [{ name: 'MeusAgendamentos' }] });
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style= { styles.container } >
    <TextInput
        style={ styles.input }
  placeholder = "Email"
  value = { email }
  onChangeText = { setEmail }
  keyboardType = "email-address"
  autoCapitalize = "none"
    />
    <TextInput
        style={ styles.input }
  placeholder = "Senha"
  secureTextEntry
  value = { senha }
  onChangeText = { setSenha }
    />
    <TouchableOpacity style={ styles.button } onPress = { handleLogin } disabled = { loading } >
      <Text style={ styles.buttonText }> { loading? 'Carregando...': 'Entrar' } </Text>
        </TouchableOpacity>
        < TouchableOpacity onPress = {() => navigation.navigate('Cadastro')
}>
  <Text style={ styles.link }> Criar conta </Text>
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
