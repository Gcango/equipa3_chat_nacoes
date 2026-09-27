import type { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const courseBodySchema = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  abbr: z.string().min(1).max(20),
  name: z.string().min(2).max(120),
  teaser: z.string().min(2).max(400),
  description: z.string().min(2).max(4000),
  imagePath: z.string().max(300).optional().nullable(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

const scheduleBodySchema = z.object({
  weekday: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().max(80).optional().nullable(),
  label: z.string().min(2).max(200),
  sortOrder: z.number().int().optional(),
});

const eventBodySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  startsAt: z.string().datetime(),
});

const resourceBodySchema = z.object({
  title: z.string().min(2).max(200),
  url: z.string().url(),
  category: z.string().min(1).max(80),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export function registerSchoolAdminRoutes(adminRouter: Router) {
  adminRouter.get("/courses", async (_req, res) => {
    const courses = await prisma.schoolCourse.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        schedules: { orderBy: [{ weekday: "asc" }, { sortOrder: "asc" }, { startTime: "asc" }] },
      },
    });
    return res.json(courses);
  });

  adminRouter.post("/courses", async (req, res) => {
    const parsed = courseBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados do curso inválidos." });
    try {
      const course = await prisma.schoolCourse.create({ data: parsed.data });
      return res.status(201).json(course);
    } catch {
      return res.status(409).json({ error: "Slug ou curso já existe." });
    }
  });

  adminRouter.patch("/courses/:id", async (req, res) => {
    const parsed = courseBodySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados inválidos." });
    try {
      const course = await prisma.schoolCourse.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      return res.json(course);
    } catch {
      return res.status(404).json({ error: "Curso não encontrado." });
    }
  });

  adminRouter.delete("/courses/:id", async (req, res) => {
    try {
      await prisma.schoolCourse.delete({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch {
      return res.status(404).json({ error: "Curso não encontrado." });
    }
  });

  adminRouter.post("/courses/:id/schedules", async (req, res) => {
    const parsed = scheduleBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Horário inválido." });
    const course = await prisma.schoolCourse.findUnique({ where: { id: req.params.id } });
    if (!course) return res.status(404).json({ error: "Curso não encontrado." });
    const entry = await prisma.courseScheduleEntry.create({
      data: { ...parsed.data, courseId: course.id },
    });
    return res.status(201).json(entry);
  });

  adminRouter.patch("/schedules/:id", async (req, res) => {
    const parsed = scheduleBodySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Horário inválido." });
    try {
      const entry = await prisma.courseScheduleEntry.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      return res.json(entry);
    } catch {
      return res.status(404).json({ error: "Horário não encontrado." });
    }
  });

  adminRouter.delete("/schedules/:id", async (req, res) => {
    try {
      await prisma.courseScheduleEntry.delete({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch {
      return res.status(404).json({ error: "Horário não encontrado." });
    }
  });

  adminRouter.post("/news", async (req, res) => {
    const parsed = z.object({ content: z.string().min(1).max(5000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Texto da notícia inválido." });
    const post = await prisma.post.create({
      data: {
        content: parsed.data.content.trim(),
        type: "NOTICIA",
        authorId: req.user!.id,
      },
      include: {
        author: { select: { id: true, name: true, course: true, classGroup: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });
    return res.status(201).json(post);
  });

  adminRouter.post("/events", async (req, res) => {
    const parsed = eventBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Evento inválido." });
    const event = await prisma.schoolEvent.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        location: parsed.data.location ?? null,
        startsAt: new Date(parsed.data.startsAt),
      },
    });
    return res.status(201).json(event);
  });

  adminRouter.patch("/events/:id", async (req, res) => {
    const parsed = eventBodySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Evento inválido." });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startsAt) data.startsAt = new Date(parsed.data.startsAt);
    try {
      const event = await prisma.schoolEvent.update({
        where: { id: req.params.id },
        data,
      });
      return res.json(event);
    } catch {
      return res.status(404).json({ error: "Evento não encontrado." });
    }
  });

  adminRouter.delete("/events/:id", async (req, res) => {
    try {
      await prisma.schoolEvent.delete({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch {
      return res.status(404).json({ error: "Evento não encontrado." });
    }
  });

  adminRouter.get("/events", async (_req, res) => {
    const events = await prisma.schoolEvent.findMany({
      orderBy: { startsAt: "asc" },
      take: 100,
    });
    return res.json(events);
  });

  adminRouter.post("/resources", async (req, res) => {
    const parsed = resourceBodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Recurso inválido." });
    const link = await prisma.resourceLink.create({ data: parsed.data });
    return res.status(201).json(link);
  });

  adminRouter.patch("/resources/:id", async (req, res) => {
    const parsed = resourceBodySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Recurso inválido." });
    try {
      const link = await prisma.resourceLink.update({
        where: { id: req.params.id },
        data: parsed.data,
      });
      return res.json(link);
    } catch {
      return res.status(404).json({ error: "Recurso não encontrado." });
    }
  });

  adminRouter.delete("/resources/:id", async (req, res) => {
    try {
      await prisma.resourceLink.delete({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch {
      return res.status(404).json({ error: "Recurso não encontrado." });
    }
  });
}
