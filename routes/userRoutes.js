  const express = require("express");
  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");

  const { PrismaClient } = require("@prisma/client");
  const { authenticate, isAdmin } = require("../middlewares/authMiddleware"); // 🔹 Importação correta

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
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Senha inválida' });

      // Cria o token com o nome e a informação de administrador no payload
      const token = jwt.sign({ userId: user.id, name: user.name, isAdmin: user.isAdmin }, SECRET, { expiresIn: '1h' });

      // Retorna o token, o nome e a informação de administrador
      res.json({ token, name: user.name, isAdmin: user.isAdmin });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno no servidor' });
    }
  });

  // 🔹 Listar todos os usuários (Somente administradores)
  router.get("/users", authenticate, isAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, isAdmin: true }, // Seleciona apenas os campos públicos
      });
      res.json(users);
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({ error: "Erro interno no servidor" });
    }
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

  // 🔹 Editar um usuário específico (Somente administradores)
  router.put("/users/:id", authenticate, async (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { id } = req.params;
    const { name, email, password } = req.body;

    try {
      const updatedData = {
        name: name || undefined,
        email: email || undefined,
        password: password ? await bcrypt.hash(password, 10) : undefined,
      };

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updatedData,
        select: { id: true, name: true, email: true },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      res.status(500).json({ error: "Erro ao atualizar usuário" });
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

  // 🔹 Excluir um usuário específico (Somente administradores)
  router.delete("/users/:id", authenticate, async (req, res) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const { id } = req.params;

    try {
      await prisma.user.delete({ where: { id } });
      res.json({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      res.status(500).json({ error: "Erro ao excluir usuário" });
    }
  });

  module.exports = router;
