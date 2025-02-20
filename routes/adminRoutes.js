const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("@prisma/client");
const { authenticate, isAdmin } = require("../middlewares/authMiddleware"); // Importação dos middlewares

const prisma = new PrismaClient();
const router = express.Router();

// PARTE DE USUÁRIOS //  
// 🔹 Rota para listar todos os usuários (Somente para Admins)
router.get("/admin/users", authenticate, isAdmin, async (req, res) => {
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

// 🔹 Rota para obter informações de um usuário específico (Apenas Admins)
router.get("/admin/users/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Buscar usuário pelo ID
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 🔹 Rota para editar um usuário (Apenas Admins podem editar usuários comuns)
router.put("/admin/users/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Impedir alteração de outros administradores
    if (user.isAdmin) {
      return res.status(403).json({ error: "Administradores não podem editar outros administradores" });
    }

    // Atualizar os dados (criptografando a senha se necessário)
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

// 🔹 Rota para deletar um usuário (Apenas Admins podem deletar usuários comuns)
router.delete("/admin/users/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Impedir que um admin delete outro admin
    if (user.isAdmin) {
      return res.status(403).json({ error: "Administradores não podem deletar outros administradores" });
    }

    // Deletar o usuário
    await prisma.user.delete({ where: { id } });

    res.json({ message: "Usuário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

module.exports = router;
  