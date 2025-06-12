// ------------ api.ts ------------
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
}

export async function fazerLogin(email: string, senha: string): Promise<IUser> {
  const response = await api.post('/login', { email, senha });
  const { token, ...userData } = response.data;
  if (!token) throw new Error('Token não recebido');
  setAuthToken(token);
  return userData;
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
  preco: number;
  duracao: string;
}

export async function listarServicos(): Promise<IServico[]> {
  const response = await api.get('/servicos');
  return response.data;
}

export interface IHorarioDisponivel {
  hora: string;
  status: 'disponivel' | 'ocupado';
}

export async function buscarHorariosDisponiveis(
  data: string,
  duracao?: number
): Promise<IHorarioDisponivel[]> {
  const params: { data: string; duracao?: number } = { data };
  if (duracao !== undefined) params.duracao = duracao;

  const response = await api.get('/horarios-disponiveis', { params });
  return response.data;
}



export interface IAgendamentoCriar {
  servico_id: number;
  data: string;
  horario: string;
}

export async function criarAgendamento(data: IAgendamentoCriar): Promise<void> {
  await api.post('/agendamentos', data);
}

export interface IAgendamento {
  id: number;
  servico_nome: string;
  servico_preco: number;
  data: string;
  horario: string;
  status: string;
}

export async function listarMeusAgendamentos(): Promise<IAgendamento[]> {
  const response = await api.get('/agendamentos/meus');
  return response.data;
}

export async function cancelarAgendamento(id: number): Promise<void> {
  await api.delete(`/agendamentos/${id}`);
}
