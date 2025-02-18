require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

const SECRET = "meusegredo"; // Mude para um valor mais seguro

// Rota para criar um usuário
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Usuário já existe" });
  }
});

// Rota para login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: "Senha inválida" });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Rota protegida
app.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    res.json(user);
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
