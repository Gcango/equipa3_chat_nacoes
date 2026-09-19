# Base de dados

- **Schema de referência:** [`schema.sql`](schema.sql)
- **Migrações activas:** `backend/prisma/` (Prisma + SQLite em desenvolvimento)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
```
