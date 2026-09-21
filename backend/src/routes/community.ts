import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireActive } from "../middleware/auth.js";

export const communityRouter = Router();

communityRouter.use(requireAuth, requireActive);

communityRouter.get("/summary", async (req, res) => {
  const userId = req.user!.id;
  const [unreadMessages, unreadNotifications] = await Promise.all([
    prisma.directMessage.count({
      where: { recipientId: userId, readAt: null },
    }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);
  return res.json({ unreadMessages, unreadNotifications });
});

communityRouter.get("/messages/threads", async (req, res) => {
  const userId = req.user!.id;
  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, course: true, classGroup: true } },
      recipient: { select: { id: true, name: true, course: true, classGroup: true } },
    },
  });

  const threads = new Map<
    string,
    {
      otherUser: { id: string; name: string; course: string; classGroup: string };
      lastMessage: string;
      lastAt: string;
      unread: number;
    }
  >();

  for (const m of messages) {
    const other = m.senderId === userId ? m.recipient : m.sender;
    if (!threads.has(other.id)) {
      const unread = await prisma.directMessage.count({
        where: { senderId: other.id, recipientId: userId, readAt: null },
      });
      threads.set(other.id, {
        otherUser: other,
        lastMessage: m.content,
        lastAt: m.createdAt.toISOString(),
        unread,
      });
    }
  }

  return res.json([...threads.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
});

communityRouter.get("/messages/with/:otherUserId", async (req, res) => {
  const userId = req.user!.id;
  const otherUserId = req.params.otherUserId;

  const other = await prisma.user.findFirst({
    where: { id: otherUserId, status: "ATIVO" },
    select: { id: true, name: true },
  });
  if (!other) return res.status(404).json({ error: "Utilizador não encontrado." });

  await prisma.directMessage.updateMany({
    where: { senderId: otherUserId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  return res.json({ otherUser: other, messages });
});

communityRouter.post("/messages", async (req, res) => {
  const schema = z.object({
    recipientId: z.string().uuid(),
    content: z.string().min(1).max(2000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Mensagem inválida." });

  const userId = req.user!.id;
  if (parsed.data.recipientId === userId) {
    return res.status(400).json({ error: "Não podes enviar mensagem a ti próprio." });
  }

  const recipient = await prisma.user.findFirst({
    where: { id: parsed.data.recipientId, status: "ATIVO" },
  });
  if (!recipient) return res.status(404).json({ error: "Destinatário não encontrado." });

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const message = await prisma.directMessage.create({
    data: {
      senderId: userId,
      recipientId: parsed.data.recipientId,
      content: parsed.data.content.trim(),
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: parsed.data.recipientId,
      title: "Nova mensagem",
      body: `${sender?.name ?? "Alguém"} enviou-te uma mensagem.`,
      href: "/mensagens",
    },
  });

  return res.status(201).json(message);
});

communityRouter.get("/notifications", async (req, res) => {
  const list = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return res.json(list);
});

communityRouter.patch("/notifications/:id/read", async (req, res) => {
  const note = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!note) return res.status(404).json({ error: "Notificação não encontrada." });

  const updated = await prisma.notification.update({
    where: { id: note.id },
    data: { readAt: new Date() },
  });
  return res.json(updated);
});

communityRouter.patch("/notifications/read-all", async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, readAt: null },
    data: { readAt: new Date() },
  });
  return res.json({ ok: true });
});

communityRouter.get("/groups", async (req, res) => {
  const userId = req.user!.id;
  const groups = await prisma.communityGroup.findMany({
    include: {
      _count: { select: { members: true } },
      members: { where: { userId }, select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return res.json(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      memberCount: g._count.members,
      isMember: g.members.length > 0,
    })),
  );
});

communityRouter.post("/groups/:id/join", async (req, res) => {
  const group = await prisma.communityGroup.findUnique({ where: { id: req.params.id } });
  if (!group) return res.status(404).json({ error: "Grupo não encontrado." });

  await prisma.groupMember.upsert({
    where: {
      groupId_userId: { groupId: group.id, userId: req.user!.id },
    },
    create: { groupId: group.id, userId: req.user!.id },
    update: {},
  });
  return res.json({ ok: true });
});

communityRouter.post("/groups/:id/leave", async (req, res) => {
  await prisma.groupMember.deleteMany({
    where: { groupId: req.params.id, userId: req.user!.id },
  });
  return res.json({ ok: true });
});

communityRouter.get("/events", async (req, res) => {
  const events = await prisma.schoolEvent.findMany({
    where: { startsAt: { gte: new Date(Date.now() - 86400000) } },
    orderBy: { startsAt: "asc" },
    take: 30,
  });
  return res.json(events);
});

communityRouter.get("/resources", async (req, res) => {
  const resources = await prisma.resourceLink.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
  return res.json(resources);
});

communityRouter.get("/school", async (_req, res) => {
  return res.json({
    name: "GERABRIEL Escola Profissional",
    motto: "Juntos construímos o nosso futuro!",
    tagline: "Chat_Nações · Conecta · Partilha · Cresce",
    emailDomain: "@epgerabriel.edu.pt",
    values: [
      "Comunicação respeitosa entre alunos, professores e escola",
      "Ambiente moderado e rede privada",
      "Formação profissional com espírito de comunidade",
    ],
    contacts: [
      { label: "Secretaria", value: "secretaria@epgerabriel.edu.pt" },
      { label: "Suporte técnico", value: "suporte@epgerabriel.edu.pt" },
    ],
  });
});
