-- Chat_Nações — Comunidade Digital Escolar
-- Referência lógica (Prisma gere migrações em backend/prisma/)

-- Utilizadores
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  studentNumber TEXT NOT NULL UNIQUE,
  course TEXT NOT NULL,
  classGroup TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ALUNO',
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  bio TEXT,
  avatarUrl TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

-- Publicações
CREATE TABLE IF NOT EXISTS Post (
  id TEXT PRIMARY KEY,
  authorId TEXT NOT NULL REFERENCES User(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'NORMAL',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL,
  deletedAt DATETIME
);

CREATE TABLE IF NOT EXISTS Comment (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL REFERENCES Post(id),
  authorId TEXT NOT NULL REFERENCES User(id),
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME
);

CREATE TABLE IF NOT EXISTS Reaction (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL REFERENCES Post(id),
  userId TEXT NOT NULL REFERENCES User(id),
  type TEXT NOT NULL DEFAULT 'LIKE',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(postId, userId)
);

CREATE TABLE IF NOT EXISTS Report (
  id TEXT PRIMARY KEY,
  targetType TEXT NOT NULL,
  targetId TEXT NOT NULL,
  reporterId TEXT NOT NULL REFERENCES User(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ABERTA',
  reviewerId TEXT REFERENCES User(id),
  resolutionNote TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolvedAt DATETIME
);
