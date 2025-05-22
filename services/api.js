import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000'
  : 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

let authToken = '';

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erro na requisição:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const fazerLogin = async (email, senha) => {
  try {
    const response = await api.post('/login', { email, senha });
    const { token, ...userData } = response.data;
    
    if (token) {
      setAuthToken(token);
      return userData;
    }
    
    throw new Error('Token não recebido na resposta');
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Falha no login. Verifique suas credenciais.';
    throw new Error(errorMessage);
  }
};

export const criarUsuario = async ({ nome, email, senha, telefone }) => {
  try {
    const response = await api.post('/usuarios', { nome, email, senha, telefone });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Falha no cadastro. Tente novamente.';
    throw new Error(errorMessage);
  }
};

export const listarServicos = async () => {
  try {
    const response = await api.get('/servicos');
    return response.data;
  } catch (error) {
    throw new Error('Falha ao carregar serviços');
  }
};

export const buscarHorariosDisponiveis = async (data, agendamentoId = null) => {
  try {
    const response = await api.get('/horarios-disponiveis', {
      params: { data, agendamentoId }
    });
    
    if (!Array.isArray(response.data)) {
      throw new Error('Formato de dados inválido');
    }
    
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Falha ao buscar horários disponíveis';
    throw new Error(errorMessage);
  }
};

export const criarAgendamento = async ({ servico_id, data, horario }) => {
  try {
    const response = await api.post('/agendamentos', {
      servico_id,
      data,
      horario
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Falha ao criar agendamento';
    throw new Error(errorMessage);
  }
};

export const listarMeusAgendamentos = async () => {
  try {
    const response = await api.get('/agendamentos/meus');
    return response.data;
  } catch (error) {
    throw new Error('Falha ao carregar agendamentos');
  }
};

export const cancelarAgendamento = async (id) => {
  try {
    const response = await api.delete(`/agendamentos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Falha ao cancelar agendamento');
  }
};

export const alterarAgendamento = async (id, { horario, servico_id }) => {
  try {
    const response = await api.put(`/agendamentos/${id}`, {
      horario,
      servico_id
    });
    return response.data;
  } catch (error) {
    throw new Error('Falha ao atualizar agendamento');
  }
};

export default api;