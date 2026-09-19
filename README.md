# Chat_Nações — Comunidade Digital Escolar

Rede social privada da escola (EP Gabriel): publicações, comentários, reações, denúncias e moderação.

**Domínio de registo:** `@epgerabriel.edu.pt`

## MVP

Login (credenciais da escola) → perfil → publicação → feed → comentário/reação → denúncia → moderação

## Documentação

Ver [`docs/`](docs/) — análise, requisitos, arquitetura, backlog US01–US08.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Express + TypeScript + Prisma |
| BD | SQLite (dev) |

## Como executar

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

API: `http://localhost:3001`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Web: `http://localhost:5173` (recarrega ao guardar ficheiros — ver [`frontend/PREVIEW.md`](frontend/PREVIEW.md))

## Contas de demonstração (fictícias)

| Email | Password | Papel |
|-------|----------|-------|
| admin.demo@epgerabriel.edu.pt | Admin123! | ADMIN (ATIVO) |
| aluno.demo@epgerabriel.edu.pt | Aluno123! | ALUNO (ATIVO) |
| pendente.demo@epgerabriel.edu.pt | Aluno123! | ALUNO (PENDENTE) |

Não usar dados pessoais reais. Ver [`SECURITY.md`](SECURITY.md).

## Equipa

| Nome | Papel | GitHub |
|------|-------|--------|
| Gabriel | Desenvolvimento | Gcango |
| Geraldo (Sense) | Desenvolvimento | main_sense |

## Processo Git

Issue → branch `feature/USxx-...` → PR → code review → merge em `main`.
