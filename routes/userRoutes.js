const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "meusegredo"; // Pegando do .env

// 🟢 Rota para criar um usuário
router.post("/register", async (req, res) => {
  const { name, email, password, isAdmin } = req.body; // Adicionamos "isAdmin"
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin: isAdmin || false, // Se não enviado, assume "false"
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: "Usuário já existe" });
  }
});

// 🟡 Rota para login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: "Senha inválida" });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// 🔴 Rota protegida para pegar informações do usuário
router.get("/me", async (req, res) => {
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

// 🔹 Rota para editar perfil (Somente o próprio usuário pode editar)
router.put("/users/update", authenticate, async (req, res) => {
  const { userId } = req.user; // Pegando o ID do usuário autenticado
  const { name, email, password } = req.body;

  try {
    // Verificar se o e-mail já existe e não pertence ao usuário atual
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "E-mail já está em uso" });
      }
    }

    // Atualizar os dados (criptografando a senha se necessário)
    const updatedData = {
      name: name || undefined,
      email: email || undefined,
      password: password ? await bcrypt.hash(password, 10) : undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
      select: { id: true, name: true, email: true }, // Apenas informações públicas
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 🔹 Rota para excluir a própria conta
router.delete("/users/delete", authenticate, async (req, res) => {
  const { userId } = req.user; // Pegando o ID do usuário autenticado

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "Conta excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router;
