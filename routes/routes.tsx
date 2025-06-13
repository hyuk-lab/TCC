import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { FloatingActionButton } from '../components/FloatingActionButton';


import LoginScreen from '../telas/LoginScreen';
import CadastroScreen from '../telas/CadastroScreen';
import MeusAgendamentosScreen from '../telas/MeusAgendamentos';
import AgendamentoScreen from '../telas/AgendamentoScreen';

const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

export type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  MeusAgendamentos: undefined;
  Agendamento: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const FloatingActionButtonWrapper = () => {
  const navigation = useNavigation<any>(); // Adicione o tipo 'any' temporariamente
  return (
    <FloatingActionButton 
      onPress={() => navigation.navigate('Agendamento')}
      iconName="add"
      iconColor="#fff"
      style={{
        position: 'absolute',
        bottom: 30,
        right: 20,
      }}
    />
  );
};

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
      <FloatingActionButtonWrapper />
    </NavigationContainer>
  );
}