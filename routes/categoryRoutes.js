const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// 🔹 Rota para criar uma nova categoria (Apenas Administradores)
router.post('/categories', authenticate, isAdmin, async (req, res) => {
  console.log("Recebendo requisição de criação de categoria:", req.body);
  const { name, description } = req.body;

  try {
    const category = await prisma.category.create({
      data: { name, description },
    });
    res.json(category);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// 🔹 Rota para listar todas as categorias
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// 🔹 Rota para atualizar uma categoria (Apenas Administradores)
router.put('/categories/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const category = await prisma.category.update({
      where: { id },
      data: { name, description },
    });
    res.json(category);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// 🔹 Rota para deletar uma categoria (Apenas Administradores)
router.delete('/categories/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

module.exports = router;