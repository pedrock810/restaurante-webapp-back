const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { authenticate, isAdmin } = require("../middlewares/authMiddleware"); // Importação dos middlewares

const prisma = new PrismaClient();
const router = express.Router();
const SECRET = process.env.JWT_SECRET || "meusegredo"; // Pegando do .env

// 🔹 Rota protegida - Somente administradores podem acessar
router.get("/admin-dashboard", authenticate, isAdmin, (req, res) => {
    res.json({ message: "Bem-vindo ao painel de administração!" });
});
  
// 🔹 Rota para listar todos os usuários (Somente para Admins)
router.get("/users", authenticate, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// 🔹 Rota para editar um usuário (Apenas Admins podem editar usuários comuns)
router.put("/admin/users/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    if (user.isAdmin) {
      return res.status(403).json({ error: "Administradores não podem editar outros administradores" });
    }

    const updatedData = {
      name: name || user.name,
      email: email || user.email,
      password: password ? await bcrypt.hash(password, 10) : user.password,
    };

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updatedData,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});


module.exports = router;
  