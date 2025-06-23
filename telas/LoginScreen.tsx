// src/telas/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet, Platform, Image,
  ActivityIndicator // Adicionado ActivityIndicator para o estado de carregamento
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/routes';
import { fazerLogin, api, IUser } from '../api/api'; // Importar IUser
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAlert } from '../components/AlertContext';
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth para gerenciar o estado de autenticação
import { AxiosResponse } from 'axios'; // Importar AxiosResponse para tipagem explícita

WebBrowser.maybeCompleteAuthSession();

type LoginNav = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: { navigation: LoginNav }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const { login } = useAuth(); // Obter a função de login do AuthContext

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Platform.select({
      ios: '489161883530-jqk3ne93qlfjmk89lnplshppu94pku1c.apps.googleusercontent.com',
      android: '489161883530-jqk3ne93qlfjmk89lnplshppu94pku1c.apps.googleusercontent.com',
      default: '489161883530-jqk3ne93qlfjmk89lnplshppu94pku1c.apps.googleusercontent.com',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        showAlert('Erro', 'Token não encontrado', 'error');
        return;
      }

      setLoading(true);
      api.post<IUser>('/login-google', { token: idToken })
        .then(async (r: AxiosResponse<IUser>) => {
          // Chamar a função login do AuthContext para armazenar o usuário e token
          await login(r.data, r.data.token as unknown as string);
          navigation.reset({ index: 0, routes: [{ name: 'MeusAgendamentos' }] });
        })
        .catch(err => {
          console.error("Erro ao autenticar com Google:", err); // Log para depuração
          showAlert('Erro', err.response?.data?.error || 'Erro ao autenticar com Google', 'error');
        })
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      showAlert('Erro', 'Falha na autenticação com Google', 'error');
    }
  }, [response, login, navigation, showAlert]); // Adicionado 'login' e 'showAlert' às dependências

  const handleLogin = () => {
    if (!email.trim() || !senha.trim()) {
      showAlert('Erro', 'Preencha email e senha', 'error');
      return;
    }

    setLoading(true);
    fazerLogin(email, senha)
      .then(async (userData: IUser) => { // userData já é do tipo IUser
        await login(userData, userData.token as unknown as string); // Chamar a função login do AuthContext
        navigation.reset({ index: 0, routes: [{ name: 'MeusAgendamentos' }] });
      })
      .catch(err => {
        console.error("Erro ao fazer login:", err); // Log para depuração
        showAlert('Erro', err.response?.data?.error || 'Erro ao fazer login', 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem‑vindo</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>ou</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, (loading || !request) && styles.buttonDisabled]}
        onPress={() => {
          setLoading(true);
          promptAsync();
        }}
        disabled={!request || loading}
      >
        {loading ? (
          <ActivityIndicator color="#444" /> // Corrigido para uma cor visível
        ) : (
          <>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_"G"_Logo.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleText}>Entrar com Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.register}
        onPress={() => navigation.navigate('Cadastro')}
      >
        <Text style={styles.registerText}>
          Não tem conta? <Text style={styles.registerLink}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F5F9FC'
  },
  title: {
    fontSize: 32, fontWeight: '700', color: '#2E86AB', marginBottom: 32, textAlign: 'center'
  },
  input: {
    height: 50, borderWidth: 1, borderColor: '#DDD', borderRadius: 8,
    paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#FFF', fontSize: 16
  },
  button: {
    height: 52, backgroundColor: '#2E86AB', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
    shadowColor: '#2E4052', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3
  },
  buttonDisabled: {
    backgroundColor: '#B1BEC9'
  },
  buttonText: {
    color: '#FFF', fontSize: 18, fontWeight: '600'
  },
  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 24
  },
  line: {
    flex: 1, height: 1, backgroundColor: '#DDD'
  },
  or: {
    marginHorizontal: 12, color: '#999', fontSize: 14
  },
  googleButton: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 8, borderWidth: 1, borderColor: '#DDD',
    justifyContent: 'center', backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  googleIcon: {
    width: 24, height: 24, marginRight: 8
  },
  googleText: {
    fontSize: 16, color: '#444'
  },
  register: {
    marginTop: 24, alignSelf: 'center'
  },
  registerText: {
    color: '#666', fontSize: 14
  },
  registerLink: {
    color: '#2E86AB', fontWeight: '600'
  }
});
