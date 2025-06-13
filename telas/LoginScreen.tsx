import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../routes/routes';
import { fazerLogin, api } from '../api/api';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes
} from '@react-native-google-signin/google-signin';
import { useAlert } from '../components/AlertContext';

type LoginNav = StackNavigationProp<RootStackParamList, 'Login'>;


// Configuração correta para TypeScript
GoogleSignin.configure({
  webClientId: '489161883530-jqk3ne93qlfjmk89lnplshppu94pku1c.apps.googleusercontent.com',
  iosClientId: '489161883530-jqk3ne93qlfjmk89lnplshppu94pku1c.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
} as any); // Usamos 'as any' para contornar a tipagem estrita

export default function LoginScreen({ navigation }: { navigation: LoginNav }) {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    try {
      setLoading(true);
      await fazerLogin(email, senha);
      navigation.reset({ index: 0, routes: [{ name: 'MeusAgendamentos' }] });
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // 1. Verifica se os serviços do Google Play estão disponíveis (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // 2. Realiza o login
      const userInfo = await GoogleSignin.signIn();

      // 3. Obtém o token de acesso
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('Não foi possível obter o token de acesso');
      }

      // 4. Envia para seu backend
      const response = await api.post('/login-google', { token: idToken });
      const { token: jwtToken } = response.data;

      if (jwtToken) {
        // 5. Armazena o token JWT para futuras requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        navigation.reset({ index: 0, routes: [{ name: 'MeusAgendamentos' }] });
      }
    } catch (error: any) {
      // Tratamento de erros específicos do Google Sign-In
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        showAlert('Aviso', 'Login cancelado pelo usuário', 'info');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showAlert('Aviso', 'Login já em progresso', 'info');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('Erro', 'Google Play Services não disponível', 'error');
      } else {
        showAlert('Erro', error.message || 'Falha ao autenticar com Google', 'error');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo</Text>

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
        <Text style={styles.buttonText}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleSigninButton
        style={styles.googleButton}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signInWithGoogle}
      />

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Cadastro')}
      >
        <Text style={styles.registerText}>
          Não tem uma conta? <Text style={styles.registerHighlight}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  button: {
    height: 50,
    backgroundColor: '#2E86AB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#B1BEC9',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 14,
  },
  googleButton: {
    width: '100%',
    height: 48,
  },
  registerButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerHighlight: {
    color: '#2E86AB',
    fontWeight: '600',
  },
});