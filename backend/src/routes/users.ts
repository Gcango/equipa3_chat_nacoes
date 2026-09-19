import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireActive } from "../middleware/auth.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      studentNumber: true,
      course: true,
      classGroup: true,
      role: true,
      status: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "Utilizador não encontrado." });
  return res.json(user);
});

usersRouter.patch("/me", requireAuth, requireActive, async (req, res) => {
  const schema = z.object({
    bio: z.string().max(500).optional(),
    name: z.string().min(2).max(120).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      course: true,
      classGroup: true,
      bio: true,
      role: true,
      status: true,
    },
  });
  return res.json(user);
});
