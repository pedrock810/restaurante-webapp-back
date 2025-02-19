const express = require("express");
const { authenticate, isAdmin } = require("../middlewares/authMiddleware"); // Importação dos middlewares

const router = express.Router();

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
        email: true,
        isAdmin: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

module.exports = router;
  