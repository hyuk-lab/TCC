// api.ts
import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000'
  : 'http://localhost:3000';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

export interface IUser {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  token: string; // Token agora é obrigatório e string
}

export async function fazerLogin(email: string, senha: string): Promise<IUser> {
  const response = await api.post('/login', { email, senha });
  const { token, ...userData } = response.data;
  if (!token) throw new Error('Token não recebido');
  setAuthToken(token);
  return { ...userData, token };
}

export interface ICadastro {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export async function criarUsuario(data: ICadastro): Promise<void> {
  await api.post('/usuarios', data);
}

export interface IServico {
  id: number;
  nome: string;
  preco: String;
  duracao: string; // Mantido como string, ex: "1 hora", "30 minutos"
}

export async function listarServicos(): Promise<IServico[]> {
  const response = await api.get('/servicos');
  return response.data;
}

export interface IHorarioDisponivel {
  hora: string;
  status: 'disponivel' | 'ocupado' | 'passado'; // Adicionado 'passado' aqui
}

// MODIFICAÇÃO: Retorna horários fixos para simplificação
export async function buscarHorariosDisponiveis(
  data: string,
  duracao?: number // 'duracao' não será usado nesta versão fixa
): Promise<IHorarioDisponivel[]> {
  console.log(`[API Mock] Buscando horários para a data: ${data}. (Horários fixos retornados)`);

  const now = new Date();
  const todayDateString = now.toISOString().split('T')[0]; // Data de hoje no formato YYYY-MM-DD

  const fixedHorarios: IHorarioDisponivel[] = [
    { hora: '09:00', status: 'disponivel' },
    { hora: '09:30', status: 'disponivel' },
    { hora: '10:00', status: 'disponivel' },
    { hora: '10:30', status: 'ocupado' }, // Exemplo de horário ocupado fixo
    { hora: '11:00', status: 'disponivel' },
    { hora: '11:30', status: 'disponivel' },
    { hora: '14:00', status: 'disponivel' },
    { hora: '14:30', status: 'disponivel' },
    { hora: '15:00', status: 'disponivel' },
    { hora: '15:30', status: 'ocupado' }, // Outro horário ocupado fixo
    { hora: '16:00', status: 'disponivel' },
    { hora: '16:30', status: 'disponivel' },
  ];

  // Ajusta o status para 'passado' se a data for de hoje e o horário já tiver decorrido

  return new Promise((resolve) => setTimeout(() => resolve(fixedHorarios.map(h => {
      if (data === todayDateString) {
        const [h_str, m_str] = h.hora.split(':').map(Number);
        const slotDateTime = new Date();
        slotDateTime.setHours(h_str, m_str, 0, 0);

        // Considera 'passado' se o slot já estiver 5 minutos no passado
        if (slotDateTime.getTime() < now.getTime() - (5 * 60 * 1000)) {
          return { ...h, status: 'passado' };
        }
      }
      return h;
    })), 500));
}

export interface IAgendamentoCriar {
  servico_id: number;
  data: string;
  horario: string;
  usuario_id: number;
}

export async function criarAgendamento(data: IAgendamentoCriar): Promise<{ id: number; message: string }> {
  try {
    const response = await api.post('/agendamentos', data);
    return response.data;
  } catch (error: any) {
    // Adicionando um log mais detalhado para erros de API
    console.error('Erro detalhado na API:', error.response?.data || error.message);
    throw error;
  }
}

export interface IAgendamento {
  id: number;
  servico_nome: string;
  servico_preco: number | string;
  data: string;
  horario: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  carro_nome?: string;
  carro_modelo?: string;
  carro_placa?: string;
}

export async function listarMeusAgendamentos(): Promise<IAgendamento[]> {
  const response = await api.get('/agendamentos/meus');
  return response.data;
}

export async function cancelarAgendamento(id: number): Promise<void> {
  await api.delete(`/agendamentos/${id}`);
}

export async function atualizarInformacoesCarro(
  agendamentoId: number,
  carroInfo: {
    carro_nome: string;
    carro_modelo: string;
    carro_placa: string;
  }
): Promise<void> {
  await api.put(`/agendamentos/${agendamentoId}/carro`, carroInfo);
}
