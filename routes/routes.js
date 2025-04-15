// routes/routes.js
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";

// Importe todas as telas
import LoginScreen from "../telas/LoginScreen";
import CadastroScreen from "../telas/CadastroScreen";
import MeusAgendamentos from "../telas/MeusAgendamentos";
import AgendamentoScreen from "../telas/AgendamentoScreen";
import AdminScreen from "../telas/AdminScreen";

const Stack = createStackNavigator();

function AppRoutes() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        {/* Autenticação */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />

        {/* Usuário */}
        <Stack.Screen name="MeusAgendamentos" component={MeusAgendamentos} />
        <Stack.Screen name="Agendamento" component={AgendamentoScreen} />

        {/* Admin */}
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppRoutes;
