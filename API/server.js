require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_para_desenvolvimento';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cleanway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let pool;

const initializeDatabase = async () => {
  try {
    const tempConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConn.end();

    pool = mysql.createPool(dbConfig);

    await createTables();
    await seedInitialData();

    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
};

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      telefone VARCHAR(20),
      tipo ENUM('user', 'admin') DEFAULT 'user',
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
      status ENUM('pendente', 'confirmado', 'cancelado') DEFAULT 'pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (servico_id) REFERENCES servicos(id)
    )`
  ];

  for (const query of queries) {
    await pool.query(query);
  }
};

const seedInitialData = async () => {
  const [users] = await pool.query('SELECT * FROM usuarios LIMIT 1');

  if (users.length === 0) {
    const senhaAdmin = bcrypt.hashSync('admin123', 8);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha, telefone, tipo) VALUES (?, ?, ?, ?, ?)',
      ['Admin', 'admin@cleanway.com', senhaAdmin, '11999999999', 'admin']
    );

    await pool.query(`
      INSERT INTO servicos (nome, preco, duracao) VALUES 
      ('Lavagem Simples', 30.00, '30 minutos'),
      ('Lavagem Completa', 50.00, '1 hora'),
      ('Lavagem Premium', 80.00, '1.5 horas')
    `);
  }
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const [user] = await pool.query(
      'SELECT tipo FROM usuarios WHERE id = ?',
      [req.userId]
    );

    if (user[0].tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];
    const validPassword = bcrypt.compareSync(senha, user.senha);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      token
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = bcrypt.hashSync(senha, 8);

    await pool.query(
      'INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)',
      [nome, email, hashedPassword, telefone || null]
    );

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.get('/servicos', async (req, res) => {
  try {
    const [servicos] = await pool.query('SELECT * FROM servicos');
    res.json(servicos);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

app.get('/horarios-disponiveis', async (req, res) => {
  try {
    const { data } = req.query;

    if (!data || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data)) {
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    const [agendamentos] = await pool.query(
      `SELECT TIME_FORMAT(horario, '%H:%i') as horario 
       FROM agendamentos 
       WHERE data = ? AND status != 'cancelado'`,
      [data]
    );

    const horariosOcupados = agendamentos.map(a => a.horario);
    const todosHorarios = Array.from({ length: 10 }, (_, i) => {
      const hora = 8 + i;
      return {
        hora: `${hora}:00`,
        status: horariosOcupados.includes(`${hora}:00`) ? 'ocupado' : 'disponivel'
      };
    });

    res.json(todosHorarios);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
  }
});

app.post('/agendamentos', authenticate, async (req, res) => {
  try {
    const { servico_id, data, horario } = req.body;

    if (!servico_id || !data || !horario) {
      return res.status(400).json({ error: 'servico_id, data e horario são obrigatórios' });
    }

    const [ocupados] = await pool.query(
      `SELECT id FROM agendamentos 
       WHERE data = ? AND horario = ? AND status != 'cancelado'`,
      [data, horario]
    );

    if (ocupados.length > 0) {
      return res.status(409).json({ error: 'Horário já ocupado' });
    }

    await pool.query(
      `INSERT INTO agendamentos (usuario_id, servico_id, data, horario, status) 
       VALUES (?, ?, ?, ?, 'pendente')`,
      [req.userId, servico_id, data, horario]
    );

    res.status(201).json({ message: 'Agendamento criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

app.get('/agendamentos/meus', authenticate, async (req, res) => {
  try {
    const [agendamentos] = await pool.query(`
      SELECT a.*, s.nome as servico_nome, s.preco as servico_preco
      FROM agendamentos a
      JOIN servicos s ON a.servico_id = s.id
      WHERE a.usuario_id = ?
      ORDER BY a.data, a.horario
    `, [req.userId]);

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

app.put('/agendamentos/:id', authenticate, async (req, res) => {
  try {
    const { horario, servico_id } = req.body;
    const { id } = req.params;

    const [agendamento] = await pool.query(
      'SELECT id FROM agendamentos WHERE id = ? AND usuario_id = ?',
      [id, req.userId]
    );

    if (agendamento.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    await pool.query(
      'UPDATE agendamentos SET horario = ?, servico_id = ? WHERE id = ?',
      [horario, servico_id, id]
    );

    res.json({ message: 'Agendamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

app.delete('/agendamentos/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [agendamento] = await pool.query(
      'SELECT id FROM agendamentos WHERE id = ? AND usuario_id = ?',
      [id, req.userId]
    );

    if (agendamento.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    await pool.query(
      'UPDATE agendamentos SET status = "cancelado" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    res.status(500).json({ error: 'Erro ao cancelar agendamento' });
  }
});

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
  });
});
