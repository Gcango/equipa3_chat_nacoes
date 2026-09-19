import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { config } from "../lib/config.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Demasiadas tentativas. Tenta mais tarde." },
});

authRouter.post("/register", (_req, res) => {
  return res.status(403).json({
    error:
      "Registo público desactivado. A escola cria e entrega as credenciais aos alunos.",
  });
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email ou palavra-passe inválidos." });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  if (user.status !== "ATIVO") {
    return res.status(403).json({
      error: "Conta não activa. Aguarda aprovação ou contacta a escola.",
    });
  }

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "8h" });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      course: user.course,
      classGroup: user.classGroup,
      bio: user.bio,
    },
  });
});
