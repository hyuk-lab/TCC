// server.ts
import dotenv from 'dotenv';
dotenv.config();
import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
type JwtPayload = any;
const app = express();
const port = +(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cleanway',
  waitForConnections: true,
  connectionLimit: 10,
});

interface UserTokenPayload extends JwtPayload {
  id: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
  }
}

// Middleware de autenticação
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return; // Retorna para encerrar a execução do middleware
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erro de verificação de token:', err);
      res.status(403).json({ error: 'Token inválido ou expirado' });
      return; // Retorna para encerrar a execução do middleware
    }
    req.userId = (user as UserTokenPayload).id;
    next();
  });
};

// Inicializa BD
async function initializeDatabase(): Promise<void> {
  const tmp = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await tmp.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  await tmp.end();

  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255),
        telefone VARCHAR(20),
        tipo ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        preco DECIMAL(10, 2) NOT NULL,
        duracao VARCHAR(50) NOT NULL
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agendamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        servico_id INT NOT NULL,
        data DATE NOT NULL,
        horario TIME NOT NULL,
        status ENUM('pendente', 'confirmado', 'cancelado') DEFAULT 'pendente',
        carro_nome VARCHAR(255),
        carro_modelo VARCHAR(255),
        carro_placa VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (servico_id) REFERENCES servicos(id)
      );
    `);

    // Inserir serviços padrão se a tabela estiver vazia
    const [rows]: any = await connection.query('SELECT COUNT(*) AS count FROM servicos');
    if (rows[0].count === 0) {
      console.log('Inserindo serviços padrão...');
      await connection.query(
        `INSERT INTO servicos (nome, preco, duracao) VALUES
        ('Lavagem Completa', 80.00, '01:00'),
        ('Lavagem Externa', 50.00, '00:30'),
        ('Polimento', 200.00, '02:00'),
        ('Higienização Interna', 150.00, '01:30');`
      );
    }

    console.log('Tabelas verificadas/criadas com sucesso e serviços padrão inseridos.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

// Rotas
app.post('/usuarios', async (req: Request, res: Response) => {
  const { nome, email, senha, telefone } = req.body;
  if (!nome || !email || !senha) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    return;
  }

  try {
    const [existingUser]: any = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)',
      [nome, email, hashedPassword, telefone || null]
    );
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    return;
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const token = sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ id: user.id, nome: user.nome, email: user.email, tipo: user.tipo, token });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/login-google', async (req: Request, res: Response): Promise<void> => {
  console.log('Requisição de Login Google:', req.body);
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(400).json({ error: 'Email não disponível' });
      return;
    }

    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [payload.email]);
    let user = (rows as any[])[0];

    if (!user) {
      const nome = payload.name || payload.email.split('@')[0];
      await pool.query(
        'INSERT INTO usuarios (nome, email) VALUES (?, ?)',
        [nome, payload.email]
      );
      const [newUser] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [payload.email]);
      user = (newUser as any[])[0];
    }

    const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ id: user.id, nome: user.nome, email: user.email, tipo: user.tipo, token: jwtToken });
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    res.status(500).json({ error: 'Falha na autenticação com Google.' });
  }
});


app.get('/servicos', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM servicos');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// REMOÇÃO TEMPORÁRIA DA LÓGICA COMPLEXA DE HORÁRIOS DISPONÍVEIS DO BACKEND
// Esta rota não será mais chamada pelo frontend para buscar horários por enquanto.
app.get('/horarios-disponiveis', authenticateToken, async (req: Request, res: Response) => {
  // Apenas para manter a rota existindo, mas não será usada pelo frontend neste momento.
  // O frontend buscará horários fixos diretamente do api.ts
  res.status(501).json({ message: 'Esta rota está desativada. Horários são fixos no frontend.' });
});


app.post('/agendamentos', authenticateToken, async (req: Request, res: Response) => {
  const { servico_id, data, horario, usuario_id } = req.body;

  // Verificação básica de dados
  if (!servico_id || !data || !horario || !usuario_id) {
    res.status(400).json({ error: 'Dados do agendamento incompletos.' });
    return;
  }

  if (req.userId !== usuario_id) {
    res.status(403).json({ error: 'Não autorizado para criar agendamento para outro usuário.' });
    return;
  }

  // Validação de data/horário no passado (com tolerância de 5 minutos)
  const agora = new Date(); // Hora atual do servidor
  const [ano, mes, dia] = data.split('-').map(Number);
  const [horas, minutos] = horario.split(':').map(Number);
  const dataAgendamento = new Date(ano, mes - 1, dia, horas, minutos); // Mês é 0-indexado

  // Se o agendamento proposto for mais de 5 minutos no passado em relação à hora atual do servidor
  if ((dataAgendamento.getTime() - agora.getTime()) < -300000) { // -300000ms = -5 minutos
    console.error(`Tentativa de agendar no passado. Agendamento: ${dataAgendamento.toISOString()}, Agora: ${agora.toISOString()}`);
    res.status(400).json({ error: 'Não é possível agendar para um horário que já passou.' });
    return;
  }


  try {
    // Verificar se já existe um agendamento para a mesma data E HORÁRIO E SERVIÇO
    // Simplificando a verificação de conflito para apenas o slot exato por enquanto
    const [existingAppointment]: any = await pool.query(
      'SELECT id FROM agendamentos WHERE data = ? AND horario = ? AND servico_id = ? AND status != "cancelado"',
      [data, horario, servico_id]
    );

    if (existingAppointment.length > 0) {
      res.status(409).json({ error: 'Este horário já está ocupado para o serviço selecionado.' });
      return;
    }

    // Inserir agendamento
    const [result]: any = await pool.query(
      'INSERT INTO agendamentos (usuario_id, servico_id, data, horario, status) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, servico_id, data, horario, 'pendente']
    );

    const newAppointmentId = result.insertId;
    res.status(201).json({ id: newAppointmentId, message: 'Agendamento criado com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.get('/agendamentos/meus', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Usuário não autenticado.' });
    return;
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        a.id,
        s.nome AS servico_nome,
        s.preco AS servico_preco,
        a.data,
        a.horario,
        a.status,
        a.carro_nome,
        a.carro_modelo,
        a.carro_placa
       FROM agendamentos a
       JOIN servicos s ON a.servico_id = s.id
       WHERE a.usuario_id = ?
       ORDER BY a.data DESC, a.horario DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar agendamentos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.delete('/agendamentos/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Primeiro, verifique se o agendamento pertence ao usuário logado
    const [agendamentoRows]: any = await pool.query(
      'SELECT usuario_id FROM agendamentos WHERE id = ?',
      [id]
    );

    if (agendamentoRows.length === 0) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }

    if (agendamentoRows[0].usuario_id !== userId) {
      res.status(403).json({ error: 'Não autorizado para cancelar este agendamento.' });
      return;
    }

    // Se o agendamento pertence ao usuário, prossiga com o cancelamento
    await pool.query('UPDATE agendamentos SET status = "cancelado" WHERE id = ?', [id]);
    res.status(200).json({ message: 'Agendamento cancelado com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.put('/agendamentos/:id/carro', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { carro_nome, carro_modelo, carro_placa } = req.body;
  const userId = req.userId;

  if (!carro_nome || !carro_modelo || !carro_placa) {
    res.status(400).json({ error: 'Informações do carro incompletas.' });
    return;
  }

  try {
    const [agendamentoRows]: any = await pool.query(
      'SELECT usuario_id FROM agendamentos WHERE id = ?',
      [id]
    );

    if (agendamentoRows.length === 0) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }

    if (agendamentoRows[0].usuario_id !== userId) {
      res.status(403).json({ error: 'Não autorizado para atualizar este agendamento.' });
      return;
    }

    await pool.query(
      'UPDATE agendamentos SET carro_nome = ?, carro_modelo = ?, carro_placa = ? WHERE id = ?',
      [carro_nome, carro_modelo, carro_placa, id]
    );
    res.status(200).json({ message: 'Informações do carro atualizadas com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar informações do carro:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


initializeDatabase()
  .then(() => app.listen(port, () => console.log(`Servidor rodando na porta ${port}`)))
  .catch(err => {
    console.error('Erro ao inicializar banco:', err);
    process.exit(1);
  });
