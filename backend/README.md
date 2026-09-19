# Backend

API REST — autenticação, utilizadores, publicações, moderação.

## Configuração

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Registo limitado a emails `@epgerabriel.edu.pt` (variável `SCHOOL_EMAIL_DOMAIN`).
