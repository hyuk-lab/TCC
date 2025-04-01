// routes/routes.js
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';

// Importe todas as telas
import Login from '../telas/LoginScreen';
import Cadastro from '../telas/Register';
import Home from '../telas/HomeScreen';
import Agendamento from '../telas/Agendamento';
import AdminHome from '../telas/AdminHome';
import Detalhes from '../telas/Detalhes'; // Você precisará criar esta tela

const Stack = createStackNavigator();

function AppRoutes() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false
        }}
      >
        {/* Telas de Autenticação */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />

        {/* Telas do Usuário Comum */}
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ gestureEnabled: false }} // Impede voltar para login
        />
        <Stack.Screen name="Agendamento" component={Agendamento} />
        <Stack.Screen name="Detalhes" component={Detalhes} />

        {/* Telas do Administrador */}
        <Stack.Screen 
          name="AdminHome" 
          component={AdminHome}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppRoutes;