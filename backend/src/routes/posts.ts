import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireActive } from "../middleware/auth.js";

export const postsRouter = Router();

postsRouter.get("/", requireAuth, requireActive, async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, course: true, classGroup: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  const userId = req.user!.id;
  const myReactions = await prisma.reaction.findMany({
    where: { userId, postId: { in: posts.map((p) => p.id) } },
    select: { postId: true },
  });
  const liked = new Set(myReactions.map((r) => r.postId));

  return res.json(
    posts.map((p) => ({
      ...p,
      likedByMe: liked.has(p.id),
    })),
  );
});

postsRouter.get("/:postId/comments", requireAuth, requireActive, async (req, res) => {
  const post = await prisma.post.findFirst({
    where: { id: req.params.postId, deletedAt: null },
  });
  if (!post) return res.status(404).json({ error: "Publicação não encontrada." });

  const comments = await prisma.comment.findMany({
    where: { postId: post.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } },
  });
  return res.json(comments);
});

postsRouter.post("/", requireAuth, requireActive, async (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(5000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Publicação inválida." });
  }

  const post = await prisma.post.create({
    data: {
      content: parsed.data.content,
      authorId: req.user!.id,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
  return res.status(201).json(post);
});

postsRouter.post("/:postId/comments", requireAuth, requireActive, async (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(2000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Comentário inválido." });

  const post = await prisma.post.findFirst({
    where: { id: req.params.postId, deletedAt: null },
  });
  if (!post) return res.status(404).json({ error: "Publicação não encontrada." });

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: req.user!.id,
      content: parsed.data.content,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  return res.status(201).json(comment);
});

postsRouter.post("/:postId/reactions", requireAuth, requireActive, async (req, res) => {
  const post = await prisma.post.findFirst({
    where: { id: req.params.postId, deletedAt: null },
  });
  if (!post) return res.status(404).json({ error: "Publicação não encontrada." });

  const reaction = await prisma.reaction.upsert({
    where: {
      postId_userId: { postId: post.id, userId: req.user!.id },
    },
    create: { postId: post.id, userId: req.user!.id, type: "LIKE" },
    update: { type: "LIKE" },
  });
  return res.json(reaction);
});
