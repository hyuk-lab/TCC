import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../telas/LoginScreen';
import CadastroScreen from '../telas/CadastroScreen';
import MeusAgendamentosScreen from '../telas/MeusAgendamentos';
import AgendamentoScreen from '../telas/AgendamentoScreen';

export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  // CORREÇÃO: A rota MeusAgendamentos agora pode receber um parâmetro newAppointmentId opcional
  MeusAgendamentos: { newAppointmentId?: number } | undefined;
  Agendamento: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Cadastro"
          component={CadastroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MeusAgendamentos"
          component={MeusAgendamentosScreen}
          options={{
            title: 'Meus Agendamentos',
            headerTitleStyle: {
              color: '#2E4052',
              fontWeight: '600',
            },
            headerStyle: {
              backgroundColor: '#F5F9FC',
              elevation: 0,
              shadowOpacity: 0,
            },
          }}
        />
        <Stack.Screen
          name="Agendamento"
          component={AgendamentoScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
