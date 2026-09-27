# Base de dados

- **Schema de referência:** [`schema.sql`](schema.sql)
- **Migrações activas:** `backend/prisma/` (Prisma + SQLite em desenvolvimento)

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
```

Ficheiro SQLite (dev): `backend/prisma/dev.db` (caminho relativo ao schema Prisma).
