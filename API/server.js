require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// [1] Rota de Login
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [users] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (users.length === 0)
      return res.status(401).json({ erro: "Credenciais inválidas" });

    const usuario = users[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida)
      return res.status(401).json({ erro: "Credenciais inválidas" });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
      },
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// [2] Buscar Horários Disponíveis
app.get("/api/horarios-disponiveis", async (req, res) => {
  const { data } = req.query;

  try {
    const [agendamentos] = await pool.query(
      "SELECT horario FROM agendamentos WHERE data = ?",
      [data]
    );

    const todosHorarios = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "14:00",
      "15:00",
      "16:00",
    ];
    const disponiveis = todosHorarios.filter(
      (h) => !agendamentos.some((a) => a.horario === h)
    );

    res.json({ disponiveis });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar horários" });
  }
});

// [3] Criar Agendamento
app.post("/api/agendamentos", async (req, res) => {
  const { usuarioId, data, horario } = req.body;

  try {
    await pool.query(
      'INSERT INTO agendamentos (usuario_id, data, horario, status) VALUES (?, ?, ?, "pendente")',
      [usuarioId, data, horario]
    );

    res.status(201).json({ mensagem: "Agendamento criado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Falha ao criar agendamento" });
  }
});

// [4] Listar Agendamentos (Admin)
app.get("/api/admin/agendamentos", async (req, res) => {
  try {
    const [agendamentos] = await pool.query(`
      SELECT a.id, a.data, a.horario, a.status, u.nome as cliente 
      FROM agendamentos a
      JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.data DESC
    `);
    res.json(agendamentos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar agendamentos" });
  }
});

// [5] Cadastro de Usuário
app.post("/api/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const [existe] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (existe.length > 0) {
      return res.status(400).json({ erro: "Email já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senhaHash]
    );

    res.status(201).json({ mensagem: "Usuário criado com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// [6] Atualizar Status (Admin)
app.patch("/api/admin/agendamentos/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query("UPDATE agendamentos SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ mensagem: "Status atualizado" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao atualizar status" });
  }
});

// Listar agendamentos do usuário
app.get("/api/agendamentos/:usuarioId", async (req, res) => {
  try {
    const [agendamentos] = await pool.query(
      `SELECT 
        id, 
        DATE_FORMAT(data, '%d/%m/%Y') as data,
        horario,
        servico,
        status
      FROM agendamentos 
      WHERE usuario_id = ? 
      ORDER BY data DESC`,
      [req.params.usuarioId]
    );
    res.json(agendamentos);
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao buscar agendamentos" });
  }
});

// Cancelar agendamento
app.delete("/api/agendamentos/:id", async (req, res) => {
  try {
    await pool.query(
      `UPDATE agendamentos 
       SET status = 'cancelado' 
       WHERE id = ? AND status = 'pendente'`,
      [req.params.id]
    );
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ erro: "Erro ao cancelar" });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
