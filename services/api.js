// services/api.js
const BASE_URL = 'http://172.16.11.13:3000';

// Função auxiliar para lidar com respostas da API
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro na requisição');
  }
  return response.json();
};

// Armazenamento do token (para uso nas requisições autenticadas)
let authToken = '';

export const setAuthToken = (token) => {
  authToken = token;
};

// Headers padrão para requisições autenticadas
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'x-access-token': authToken
});

// 1. Autenticação
export const fazerLogin = async (email, senha) => {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });

  const data = await handleResponse(response);
  setAuthToken(data.token); // Armazena o token após login
  return data;
};

// 2. Cadastro de Usuários
export const criarUsuario = async ({ nome, email, senha }) => {
  const response = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha }),
  });

  return handleResponse(response);
};

// 3. Serviços
export const listarServicos = async () => {
  const response = await fetch(`${BASE_URL}/servicos`);
  return handleResponse(response);
};

// 4. Horários Disponíveis
export const buscarHorariosDisponiveis = async (data) => {
  const response = await fetch(`${BASE_URL}/horarios-disponiveis?data=${encodeURIComponent(data)}`);
  return handleResponse(response);
};

// 5. Agendamentos
export const criarAgendamento = async ({ servico_id, data, horario }) => {
  const response = await fetch(`${BASE_URL}/agendamentos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ servico_id, data, horario }),
  });

  return handleResponse(response);
};

export const listarMeusAgendamentos = async () => {
  const response = await fetch(`${BASE_URL}/agendamentos`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const cancelarAgendamento = async (id) => {
  const response = await fetch(`${BASE_URL}/agendamentos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// 6. Painel Administrativo
export const listarTodosAgendamentos = async () => {
  const response = await fetch(`${BASE_URL}/admin/agendamentos`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

export const atualizarStatusAgendamento = async (id, status) => {
  const response = await fetch(`${BASE_URL}/admin/agendamentos/${id}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  return handleResponse(response);
};