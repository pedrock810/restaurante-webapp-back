const express = require('express');
const slugify = require('slugify'); // 🔹 Biblioteca para gerar slugs
const { PrismaClient } = require('@prisma/client');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// 🔹 Função para gerar slug único
async function generateUniqueSlug(name) {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (await prisma.dish.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
}

// 🔹 Rota para criar um novo prato (Apenas Administradores)
router.post('/dishes', authenticate, isAdmin, async (req, res) => {
  const { name, description, price, photo, categoryId } = req.body;

  try {
    const slug = await generateUniqueSlug(name); // 🔹 Gera um slug único
    const dish = await prisma.dish.create({
      data: { name, slug, description, price, photo, categoryId },
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
router.get('/dishes/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const dish = await prisma.dish.findUnique({
      where: { slug },
      include: { category: true },
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
router.put('/dishes/:slug', authenticate, isAdmin, async (req, res) => {
  const { slug } = req.params;
  const { name, description, price, photo, categoryId } = req.body;

  try {
    const newSlug = await generateUniqueSlug(name);

    const dish = await prisma.dish.update({
      where: { slug },
      data: { name, slug: newSlug, description, price, photo, categoryId },
    });

    res.json(dish);
  } catch (error) {
    console.error('Erro ao atualizar prato:', error);
    res.status(500).json({ error: 'Erro ao atualizar prato' });
  }
});

// 🔹 Rota para deletar um prato (Apenas Administradores)
router.delete('/dishes/:slug', authenticate, isAdmin, async (req, res) => {
  const { slug } = req.params;

  try {
    await prisma.dish.delete({ where: { slug } });
    res.json({ message: 'Prato deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar prato:', error);
    res.status(500).json({ error: 'Erro ao deletar prato' });
  }
});

async function generateSlugsForExistingDishes() {
  const dishes = await prisma.dish.findMany();
  for (const dish of dishes) {
    const slug = await generateUniqueSlug(dish.name);
    await prisma.dish.update({
      where: { id: dish.id },
      data: { slug },
    });
  }
}

generateSlugsForExistingDishes();

module.exports = router;