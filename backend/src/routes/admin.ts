import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { config, isSchoolEmail } from "../lib/config.js";
import { requireAuth, requireActive, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireActive, requireAdmin);

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  studentNumber: z.string().min(3).max(32),
  course: z.string().min(2).max(80),
  classGroup: z.string().min(1).max(40),
  password: z.string().min(8).max(128),
  role: z.enum(["ALUNO", "PROFESSOR", "ADMIN"]).optional(),
});

adminRouter.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados inválidos." });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();
  if (!isSchoolEmail(email)) {
    return res.status(400).json({
      error: `Email deve ser @${config.schoolEmailDomain}.`,
    });
  }
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { studentNumber: data.studentNumber }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email ou número de aluno já existe." });
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      studentNumber: data.studentNumber,
      course: data.course,
      classGroup: data.classGroup,
      passwordHash,
      role: data.role ?? "ALUNO",
      status: "ATIVO",
    },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  return res.status(201).json(user);
});

adminRouter.get("/users/pending", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { status: "PENDENTE" },
    select: {
      id: true,
      name: true,
      email: true,
      studentNumber: true,
      course: true,
      classGroup: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return res.json(users);
});

adminRouter.patch("/users/:id/approve", async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: "ATIVO" },
    select: { id: true, email: true, status: true },
  });
  return res.json(user);
});

adminRouter.get("/reports", async (_req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: "ABERTA" },
    include: { reporter: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const postIds = reports.filter((r) => r.targetType === "POST").map((r) => r.targetId);
  const posts = postIds.length
    ? await prisma.post.findMany({
        where: { id: { in: postIds } },
        include: { author: { select: { id: true, name: true, email: true } } },
      })
    : [];
  const postById = new Map(posts.map((p) => [p.id, p]));

  return res.json(
    reports.map((r) => ({
      ...r,
      post:
        r.targetType === "POST"
          ? postById.get(r.targetId) ?? null
          : null,
    })),
  );
});

adminRouter.patch("/users/:id/status", async (req, res) => {
  const schema = z.object({
    status: z.enum(["ATIVO", "SUSPENSO", "BLOQUEADO", "PENDENTE"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Estado inválido." });

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
    select: { id: true, email: true, name: true, status: true },
  });
  return res.json(user);
});

adminRouter.patch("/reports/:id/resolve", async (req, res) => {
  const schema = z.object({
    status: z.enum(["RESOLVIDA", "REJEITADA"]),
    resolutionNote: z.string().max(500).optional(),
    removePost: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos." });

  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) return res.status(404).json({ error: "Denúncia não encontrada." });

  if (parsed.data.removePost && report.targetType === "POST") {
    await prisma.post.update({
      where: { id: report.targetId },
      data: { deletedAt: new Date() },
    });
  }

  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote,
      reviewerId: req.user!.id,
      resolvedAt: new Date(),
    },
  });
  return res.json(updated);
});
