const express = require("express");
const { authenticate, isAdmin } = require("../middlewares/authMiddleware"); // Importação dos middlewares

const router = express.Router();

// 🔹 Rota protegida - Somente administradores podem acessar
router.get("/admin-dashboard", authenticate, isAdmin, (req, res) => {
    res.json({ message: "Bem-vindo ao painel de administração!" });
  });
  
module.exports = router;
  