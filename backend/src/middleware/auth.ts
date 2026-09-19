import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";
import { prisma } from "../lib/prisma.js";
import type { Role, UserStatus } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Sessão inválida." });
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida." });
  }
}

export function requireActive(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });
  if (req.user.status !== "ATIVO") {
    return res.status(403).json({ error: "Conta não activa. Contacta a escola." });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Não autenticado." });
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Acesso reservado a administradores." });
  }
  next();
}
