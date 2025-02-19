require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Prisma
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Inicializa Express
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Importação das rotas
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// 🔹 Use as rotas de usuário antes das de admin para evitar conflitos
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes); // Altere para "/api/admin" para evitar conflito com "/api/users"

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
