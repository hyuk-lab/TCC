const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// Configuração do banco de dados MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // substitua pelo seu usuário MySQL
  password: '', // substitua pela sua senha MySQL
  database: 'cleanway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(bodyParser.json());

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(403).json({ auth: false, message: 'Token não fornecido' });

  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) return res.status(500).json({ auth: false, message: 'Falha ao autenticar token' });
    req.userId = decoded.id;
    next();
  });
};

// 1. Autenticação
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = rows[0];
    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha inválida' });
    }

    const token = jwt.sign({ id: usuario.id }, 'secret', { expiresIn: '24h' });

    res.json({ 
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// 2. Cadastro de Usuários
app.post('/usuarios', async (req, res) => {
  const { nome, email, senha } = req.body;
  
  try {
    // Verifica se o email já existe
    const [rows] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const senhaHash = bcrypt.hashSync(senha, 8);

    // Insere o novo usuário
    await pool.execute(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

// 3. Serviços Disponíveis
app.get('/servicos', async (req, res) => {
  try {
    const servicos = [
      { id: 1, nome: 'Lavagem Simples', preco: 30.00, duracao: '30 minutos' },
      { id: 2, nome: 'Lavagem Completa', preco: 50.00, duracao: '1 hora' },
      { id: 3, nome: 'Lavagem Premium', preco: 80.00, duracao: '1.5 horas' }
    ];
    res.json(servicos);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar serviços' });
  }
});

// 4. Horários Disponíveis
app.get('/horarios-disponiveis', async (req, res) => {
  const { data } = req.query;
  
  try {
    // Verifica agendamentos existentes na data
    const [agendamentos] = await pool.execute(
      'SELECT horario FROM agendamentos WHERE data = ?',
      [data]
    );

    const horariosOcupados = agendamentos.map(a => a.horario);
    
    // Horários padrão disponíveis
    const todosHorarios = [
      '08:00:00', '09:00:00', '10:00:00', '11:00:00',
      '13:00:00', '14:00:00', '15:00:00', '16:00:00'
    ];

    const horariosDisponiveis = todosHorarios.filter(
      horario => !horariosOcupados.includes(horario)
    );

    res.json(horariosDisponiveis);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar horários' });
  }
});

// 5. CRUD de Agendamentos
app.post('/agendamentos', verifyToken, async (req, res) => {
  const { servico_id, data, horario } = req.body;
  
  try {
    // Verifica se o horário está disponível
    const [horarioOcupado] = await pool.execute(
      'SELECT id FROM agendamentos WHERE data = ? AND horario = ?',
      [data, horario]
    );
    
    if (horarioOcupado.length > 0) {
      return res.status(400).json({ message: 'Horário já ocupado' });
    }

    // Cria o agendamento
    const [result] = await pool.execute(
      'INSERT INTO agendamentos (usuario_id, servico_id, data, horario) VALUES (?, ?, ?, ?)',
      [req.userId, servico_id, data, horario]
    );

    // Retorna o agendamento criado
    const [novoAgendamento] = await pool.execute(
      `SELECT a.*, s.nome as servico_nome, s.preco as servico_preco 
       FROM agendamentos a
       JOIN servicos s ON a.servico_id = s.id
       WHERE a.id = ?`,
      [result.insertId]
    );

    res.status(201).json(novoAgendamento[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar agendamento' });
  }
});

app.get('/agendamentos', verifyToken, async (req, res) => {
  try {
    const [agendamentos] = await pool.execute(
      `SELECT a.*, s.nome as servico_nome, s.preco as servico_preco 
       FROM agendamentos a
       JOIN servicos s ON a.servico_id = s.id
       WHERE a.usuario_id = ?
       ORDER BY a.data, a.horario`,
      [req.userId]
    );
    
    res.json(agendamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos' });
  }
});

app.delete('/agendamentos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verifica se o agendamento pertence ao usuário
    const [agendamento] = await pool.execute(
      'SELECT * FROM agendamentos WHERE id = ? AND usuario_id = ?',
      [id, req.userId]
    );
    
    if (agendamento.length === 0) {
      return res.status(404).json({ message: 'Agendamento não encontrado' });
    }

    // Remove o agendamento
    await pool.execute(
      'DELETE FROM agendamentos WHERE id = ?',
      [id]
    );

    res.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cancelar agendamento' });
  }
});

// 6. Painel Administrativo
app.get('/admin/agendamentos', verifyToken, async (req, res) => {
  try {
    // Verifica se o usuário é admin
    const [usuario] = await pool.execute(
      'SELECT tipo FROM usuarios WHERE id = ?',
      [req.userId]
    );
    
    if (usuario[0].tipo !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Retorna todos agendamentos com info do usuário
    const [agendamentos] = await pool.execute(
      `SELECT a.*, u.nome as cliente, u.email, s.nome as servico_nome 
       FROM agendamentos a
       JOIN usuarios u ON a.usuario_id = u.id
       JOIN servicos s ON a.servico_id = s.id
       ORDER BY a.data, a.horario`
    );
    
    res.json(agendamentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos' });
  }
});

app.put('/admin/agendamentos/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    // Verifica se o usuário é admin
    const [usuario] = await pool.execute(
      'SELECT tipo FROM usuarios WHERE id = ?',
      [req.userId]
    );
    
    if (usuario[0].tipo !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Atualiza o status
    await pool.execute(
      'UPDATE agendamentos SET status = ? WHERE id = ?',
      [status, id]
    );

    // Retorna o agendamento atualizado
    const [agendamento] = await pool.execute(
      `SELECT a.*, u.nome as cliente 
       FROM agendamentos a
       JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json(agendamento[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar agendamento' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});