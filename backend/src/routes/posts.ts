import { Router } from "express";
import { z } from "zod";
import type { PostType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireActive } from "../middleware/auth.js";

export const postsRouter = Router();

const POST_TYPES = ["NORMAL", "NOTICIA", "PROJETO", "EVENTO"] as const;

async function enrichPosts(posts: Awaited<ReturnType<typeof loadPosts>>, userId: string) {
  const myReactions = await prisma.reaction.findMany({
    where: { userId, postId: { in: posts.map((p) => p.id) } },
    select: { postId: true },
  });
  const liked = new Set(myReactions.map((r) => r.postId));
  return posts.map((p) => ({
    ...p,
    likedByMe: liked.has(p.id),
  }));
}

function loadPosts(where: Prisma.PostWhereInput) {
  return prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, course: true, classGroup: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
}

postsRouter.get("/", requireAuth, requireActive, async (req, res) => {
  const typeParam = typeof req.query.type === "string" ? req.query.type : undefined;
  const typeFilter =
    typeParam && POST_TYPES.includes(typeParam as (typeof POST_TYPES)[number])
      ? (typeParam as PostType)
      : undefined;

  const where = typeFilter
    ? { deletedAt: null, type: typeFilter }
    : { deletedAt: null, type: { not: "PROJETO" as PostType } };

  const posts = await loadPosts(where);
  const userId = req.user!.id;
  return res.json(await enrichPosts(posts, userId));
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
  const schema = z.object({
    content: z.string().min(1).max(5000),
    type: z.enum(POST_TYPES).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Publicação inválida." });
  }

  const created = await prisma.post.create({
    data: {
      content: parsed.data.content.trim(),
      type: parsed.data.type ?? "NORMAL",
      authorId: req.user!.id,
    },
  });

  const post = await prisma.post.findUnique({
    where: { id: created.id },
    include: {
      author: { select: { id: true, name: true, course: true, classGroup: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  if (!post) {
    return res.status(201).json(created);
  }

  const [formatted] = await enrichPosts([post], req.user!.id);
  return res.status(201).json(formatted);
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
      content: parsed.data.content.trim(),
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

  const userId = req.user!.id;
  const existing = await prisma.reaction.findUnique({
    where: { postId_userId: { postId: post.id, userId } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    const count = await prisma.reaction.count({ where: { postId: post.id } });
    return res.json({ likedByMe: false, reactions: count });
  }

  await prisma.reaction.create({
    data: { postId: post.id, userId, type: "LIKE" },
  });
  const count = await prisma.reaction.count({ where: { postId: post.id } });
  return res.json({ likedByMe: true, reactions: count });
});
