require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

// Inicializa o Prisma e Express
const prisma = new PrismaClient();
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Importação das rotas
const userRoutes = require("./routes/userRoutes");
app.use("/api", userRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api", adminRoutes);

const dishRoutes = require("./routes/dishRoutes");
app.use("/api", dishRoutes);

const categoryRoutes = require("./routes/categoryRoutes"); 
app.use("/api", categoryRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
