# Backend

API REST — autenticação, utilizadores, publicações, moderação.

## Configuração

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

| Script | Função |
|--------|--------|
| `npm run db:setup` | `prisma generate` + migrações + seed |
| `npm run db:migrate` | Nova migração em desenvolvimento |
| `npm run db:seed` | Só seed (requer `.env` com `DATABASE_URL`) |
| `npm run db:studio` | Prisma Studio |

Registo limitado a emails `@epgerabriel.edu.pt` (variável `SCHOOL_EMAIL_DOMAIN`).
