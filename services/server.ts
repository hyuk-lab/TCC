// server.ts
import dotenv from 'dotenv';
dotenv.config();

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

// Inicializa BD
async function initializeDatabase(): Promise<void> {
  const tmp = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await tmp.end();

  const tableQueries = [
    `CREATE TABLE IF NOT EXISTS usuarios (
       id INT AUTO_INCREMENT PRIMARY KEY,
       nome VARCHAR(100) NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       senha VARCHAR(255) NOT NULL,
       telefone VARCHAR(20),
       tipo ENUM('user','admin') DEFAULT 'user',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     )`,
    `CREATE TABLE IF NOT EXISTS servicos (
       id INT AUTO_INCREMENT PRIMARY KEY,
       nome VARCHAR(100) NOT NULL,
       preco DECIMAL(10,2) NOT NULL,
       duracao VARCHAR(50) NOT NULL
     )`,
    `CREATE TABLE IF NOT EXISTS agendamentos (
       id INT AUTO_INCREMENT PRIMARY KEY,
       usuario_id INT NOT NULL,
       servico_id INT NOT NULL,
       data DATE NOT NULL,
       horario TIME NOT NULL,
       status ENUM('pendente','confirmado','cancelado') DEFAULT 'pendente',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
       FOREIGN KEY (servico_id) REFERENCES servicos(id)
     )`,
  ];

  for (const q of tableQueries) {
    await pool.query(q);
  }

  const [users] = await pool.query('SELECT id FROM usuarios LIMIT 1');
  if ((users as any[]).length === 0) {
    const hash = bcrypt.hashSync('admin123', 8);
    await pool.query(
      'INSERT INTO usuarios (nome,email,senha,telefone,tipo) VALUES (?,?,?,?,?)',
      ['Admin', 'admin@cleanway.com', hash, '11999999999', 'admin']
    );
    await pool.query(`
      INSERT INTO servicos (nome,preco,duracao) VALUES
      ('Lavagem Simples',30.00,'30 minutos'),
      ('Lavagem Completa',50.00,'1 hora'),
      ('Lavagem Premium',80.00,'1.5 horas')
    `);
  }
}

// Middleware de autenticação
function authenticate(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    req.userId = decoded.id;
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

// ROTAS
app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  const users = rows as any[];
  if (users.length === 0 || !bcrypt.compareSync(senha, users[0].senha)) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const user = users[0];
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ id: user.id, nome: user.nome, email: user.email, tipo: user.tipo, token });
});

app.post('/usuarios', async (req: Request, res: Response): Promise<void> => {
  const { nome, email, senha, telefone } = req.body;
  if (!nome || !email || !senha) {
    res.status(400).json({ error: 'Campos obrigatórios faltando' });
    return;
  }

  const [exists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if ((exists as any[]).length > 0) {
    res.status(400).json({ error: 'Email já cadastrado' });
    return;
  }

  const hash = bcrypt.hashSync(senha, 8);
  await pool.query(
    'INSERT INTO usuarios (nome,email,senha,telefone) VALUES (?,?,?,?)',
    [nome, email, hash, telefone || null]
  );
  res.status(201).json({ message: 'Usuário criado' });
});

app.get('/servicos', async (_req: Request, res: Response): Promise<void> => {
  const [servicos] = await pool.query('SELECT * FROM servicos');
  res.json(servicos);
});

app.get('/horarios-disponiveis', async (req: Request, res: Response): Promise<void> => {
  const data = req.query.data as string;
  const duracao = Number(req.query.duracao) || 30;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    res.status(400).json({ error: 'Data inválida. Use YYYY-MM-DD' });
    return;
  }

  function toMinutes(hm: string): number {
    const [h, m] = hm.split(':').map(Number);
    return h * 60 + m;
  }

  function toHM(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT TIME_FORMAT(horario, '%H:%i') AS hora, s.duracao
       FROM agendamentos a
       JOIN servicos s ON a.servico_id = s.id
      WHERE a.data = ? AND a.status != 'cancelado'`,
    [data]
  );

  const ocupados: Array<[number, number]> = rows.map((r): [number, number] => {
    const start = toMinutes(r.hora as string);
    const match = (r.duracao as string).match(/(\d+)(?::| )(\d+)?/);
    const h = match ? Number(match[1]) : 0;
    const m = match && match[2] ? Number(match[2]) : 0;
    const durMin = h * 60 + m;
    return [start, start + durMin];
  });

  const slots: { hora: string; status: 'disponivel' | 'ocupado' }[] = [];
  for (let t = 8 * 60; t + duracao <= 18 * 60; t += 30) {
    const fim = t + duracao;
    const conflito = ocupados.some(([s, e]) => !(e <= t || s >= fim));
    slots.push({ hora: toHM(t), status: conflito ? 'ocupado' : 'disponivel' });
  }

  res.json(slots);
});

app.post('/agendamentos', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { servico_id, data, horario } = req.body;
  if (!servico_id || !data || !horario) {
    res.status(400).json({ error: 'servico_id, data e horario são obrigatórios' });
    return;
  }

  const [ex] = await pool.query(
    'SELECT id FROM agendamentos WHERE data = ? AND horario = ? AND status != "cancelado"',
    [data, horario]
  );
  if ((ex as any[]).length > 0) {
    res.status(409).json({ error: 'Horário já ocupado' });
    return;
  }

  await pool.query(
    'INSERT INTO agendamentos (usuario_id,servico_id,data,horario,status) VALUES (?,?,?,?,?)',
    [req.userId, servico_id, data, horario, 'pendente']
  );
  res.status(201).json({ message: 'Agendamento criado' });
});

app.get('/agendamentos/meus', authenticate, async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query(
    `SELECT a.*, s.nome AS servico_nome, s.preco AS servico_preco
     FROM agendamentos a
     JOIN servicos s ON a.servico_id = s.id
     WHERE a.usuario_id = ?
     ORDER BY a.data, a.horario`,
    [req.userId]
  );
  res.json(rows);
});

app.delete('/agendamentos/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = +req.params.id;
  await pool.query('UPDATE agendamentos SET status = "cancelado" WHERE id = ?', [id]);
  res.json({ message: 'Agendamento cancelado' });
});

initializeDatabase()
  .then(() => app.listen(port, () => console.log(`Servidor rodando na porta ${port}`)))
  .catch(err => {
    console.error('Erro ao inicializar banco:', err);
    process.exit(1);
  });
