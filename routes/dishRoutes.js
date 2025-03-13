const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// 🔹 Rota para criar um novo prato (Apenas Administradores)
router.post('/dishes', authenticate, isAdmin, async (req, res) => {
  const { name, description, price, photo, categoryId } = req.body;

  try {
    const dish = await prisma.dish.create({
      data: { name, description, price, photo, categoryId },
    });
    res.json(dish);
  } catch (error) {
    console.error('Erro ao criar prato:', error);
    res.status(500).json({ error: 'Erro ao criar prato' });
  }
});

// 🔹 Rota para listar todos os pratos
router.get('/dishes', async (req, res) => {
  try {
    const dishes = await prisma.dish.findMany({
      include: { category: true }, // Inclui a categoria relacionada
    });
    res.json(dishes);
  } catch (error) {
    console.error('Erro ao buscar pratos:', error);
    res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

// 🔹 Rota para exibir um prato por ID
router.get('/dishes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: { category: true }, // Inclui a categoria relacionada
    });

    if (!dish) {
      return res.status(404).json({ error: 'Prato não encontrado' });
    }

    res.json(dish);
  } catch (error) {
    console.error('Erro ao buscar prato:', error);
    res.status(500).json({ error: 'Erro ao buscar prato' });
  }
});

// 🔹 Rota para atualizar um prato (Apenas Administradores)
router.put('/dishes/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, photo, categoryId } = req.body;

  try {
    const dish = await prisma.dish.update({
      where: { id },
      data: { name, description, price, photo, categoryId },
    });
    res.json(dish);
  } catch (error) {
    console.error('Erro ao atualizar prato:', error);
    res.status(500).json({ error: 'Erro ao atualizar prato' });
  }
});

// 🔹 Rota para deletar um prato (Apenas Administradores)
router.delete('/dishes/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.dish.delete({ where: { id } });
    res.json({ message: 'Prato deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar prato:', error);
    res.status(500).json({ error: 'Erro ao deletar prato' });
  }
});

module.exports = router;