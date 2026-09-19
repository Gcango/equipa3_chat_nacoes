import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireActive } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.post("/", requireAuth, requireActive, async (req, res) => {
  const schema = z.object({
    targetType: z.enum(["POST", "COMMENT"]),
    targetId: z.string().uuid(),
    reason: z.enum([
      "BULLYING",
      "INSULTO",
      "AMEACA",
      "OFENSIVO",
      "IMPROPRIO",
      "SPAM",
      "OUTRO",
    ]),
    description: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Denúncia inválida." });

  const report = await prisma.report.create({
    data: {
      ...parsed.data,
      reporterId: req.user!.id,
    },
  });
  return res.status(201).json(report);
});
