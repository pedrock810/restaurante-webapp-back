const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, isAdmin } = require("../middlewares/authMiddleware"); // Middleware de autenticação

const prisma = new PrismaClient();
const router = express.Router();

// 🔹 Criar um novo prato (Apenas Administradores)
router.post("/admin/dishes", authenticate, isAdmin, async (req, res) => {
  const { name, description, price, photo } = req.body;

  try {
    const dish = await prisma.dish.create({
      data: { name, description, price, photo },
    });
    res.json(dish);
  } catch (error) {
    console.error("Erro ao criar prato:", error);
    res.status(500).json({ error: "Erro ao criar prato" });
  }
});

// 🔹 Listar todos os pratos
router.get("/dishes", async (req, res) => {
  try {
    const dishes = await prisma.dish.findMany();
    res.json(dishes);
  } catch (error) {
    console.error("Erro ao buscar pratos:", error);
    res.status(500).json({ error: "Erro ao buscar pratos" });
  }
});

// 🔹 Buscar um prato específico pelo ID
router.get("/dishes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dish = await prisma.dish.findUnique({ where: { id } });

    if (!dish) return res.status(404).json({ error: "Prato não encontrado" });

    res.json(dish);
  } catch (error) {
    console.error("Erro ao buscar prato:", error);
    res.status(500).json({ error: "Erro ao buscar prato" });
  }
});

// 🔹 Atualizar um prato (Apenas Administradores)
router.put("/admin/dishes/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, photo } = req.body;

  try {
    const dish = await prisma.dish.findUnique({ where: { id } });
    if (!dish) return res.status(404).json({ error: "Prato não encontrado" });

    const updatedDish = await prisma.dish.update({
      where: { id },
      data: { name, description, price, photo },
    });

    res.json(updatedDish);
  } catch (error) {
    console.error("Erro ao atualizar prato:", error);
    res.status(500).json({ error: "Erro ao atualizar prato" });
  }
});

// 🔹 Deletar um prato (Apenas Administradores)
router.delete("/admin/dishes/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const dish = await prisma.dish.findUnique({ where: { id } });
    if (!dish) return res.status(404).json({ error: "Prato não encontrado" });

    await prisma.dish.delete({ where: { id } });

    res.json({ message: "Prato deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar prato:", error);
    res.status(500).json({ error: "Erro ao deletar prato" });
  }
});

module.exports = router;
