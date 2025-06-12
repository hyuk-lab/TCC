// ------------ AppRoutes.tsx ------------
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import LoginScreen from '../telas/LoginScreen';
import CadastroScreen from '../telas/CadastroScreen';
import MeusAgendamentosScreen from '../telas/MeusAgendamentos';
import AgendamentoScreen from '../telas/AgendamentoScreen';

export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  MeusAgendamentos: undefined;
  Agendamento: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <NavigationContainer>
    <Stack.Navigator initialRouteName= "Login" >
    <Stack.Screen 
          name="Login"
  component = { LoginScreen }
  options = {{ headerShown: false }
} 
        />
  < Stack.Screen
name = "Cadastro"
component = { CadastroScreen }
options = {{ headerShown: false }} 
        />
  < Stack.Screen
name = "MeusAgendamentos"
component = { MeusAgendamentosScreen }
options = {({ navigation }) => ({
  title: '',
  headerRight: () => (
    <TouchableOpacity onPress= {() => navigation.navigate('Agendamento')
} style = {{ marginRight: 15 }}>
  <MaterialIcons name="add" size = { 24} color = "#2E86AB" />
    </TouchableOpacity>
            ),
headerLeft: () => null,
          })}
        />
  < Stack.Screen
name = "Agendamento"
component = { AgendamentoScreen }
options = {{ headerShown: false }} 
        />
  </Stack.Navigator>
  </NavigationContainer>
  );
}
