import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { TouchableOpacity } from "react-native"; // Adicione esta linha
import { MaterialIcons } from '@expo/vector-icons'; // Adicione esta linha
import LoginScreen from "../telas/LoginScreen";
import CadastroScreen from "../telas/CadastroScreen";
import MeusAgendamentos from "../telas/MeusAgendamentos";
import AgendamentoScreen from "../telas/AgendamentoScreen";

const Stack = createStackNavigator();

function AppRoutes() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Autenticação */}
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

        {/* Fluxo principal */}
        <Stack.Screen 
          name="MeusAgendamentos" 
          component={MeusAgendamentos} 
          options={({ navigation }) => ({ 
            title: 'Meus Agendamentos',
            headerRight: () => (
              <TouchableOpacity 
                style={{ marginRight: 15 }}
                onPress={() => navigation.navigate('Agendamento')}
              >
                <MaterialIcons name="add" size={24} color="#2E86AB" />
              </TouchableOpacity>
            ),
            headerLeft: null // Remove o botão de voltar
          })}
        />
        <Stack.Screen 
          name="Agendamento" 
          component={AgendamentoScreen} 
          options={{ 
            title: 'Novo Agendamento',
            headerLeft: () => (
              <TouchableOpacity 
                style={{ marginLeft: 15 }}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color="#2E86AB" />
              </TouchableOpacity>
            )
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppRoutes;