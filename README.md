# Chat_Nações — Comunidade Digital Escolar

**Projeto integrador · Equipa Gabriel e Sense**

Rede social **privada** da comunidade escolar (EP Gabriel / GERABRIEL): publicações, comentários, reações, denúncias e moderação, com foco em ambiente seguro e identidade validada (`@epgerabriel.edu.pt`).

## Objetivo do produto

Substituir (em parte) o uso de redes externas por um espaço controlado pela escola: interação entre alunos e professores, divulgação de projetos e notícias, e mecanismos de denúncia e moderação humana.

## Fluxo mínimo demonstrável (enunciado)

```text
Conta criada pela escola → Login → Perfil → Publicação → Feed → Comentário/Reação → Denúncia → Análise (admin)
```

## Documentação do projeto (entregáveis académicos)

Toda a fase de análise e desenho está em [`docs/`](docs/):

| Documento | Conteúdo |
|-----------|----------|
| [Enunciado](./docs/00_enunciado_projeto_integrador.md) | Brief oficial do projeto integrador |
| [Mapa de entregáveis](./docs/00_mapa_entregaveis.md) | Onde está cada entregável 1–13 |
| [01 Análise](./docs/01_analise_problema.md) | Problema, utilizadores, objetivos |
| [02 Requisitos](./docs/02_requisitos.md) | RF / RNF / regras de negócio |
| [03 Casos de uso](./docs/03_casos_de_uso.md) | Atores e fluxos |
| [04 Arquitetura](./docs/04_arquitetura.md) | Stack, camadas, segurança |
| [05 Modelo de dados](./docs/05_modelo_dados.md) | DER e entidades |
| [06 Mockups](./docs/06_mockups.md) | Ecrãs e wireframes |
| [07 Backlog](./docs/07_backlog.md) | Kanban / Issues (US01–US15) |
| [08 Testes](./docs/08_testes.md) | Relatório de testes |
| [Estado e roadmap](./docs/14_estado_implementacao_e_roadmap.md) | Gap vs enunciado |

Processo de contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md) · Segurança: [`SECURITY.md`](SECURITY.md)

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | Node.js, Express, TypeScript, Prisma |
| Base de dados | SQLite (desenvolvimento); PostgreSQL recomendado em produção |
| Autenticação | JWT + bcrypt; RBAC (`ALUNO`, `PROFESSOR`, `ADMIN`) |

## Como executar

### Pré-requisitos

- Node.js 18+
- npm

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

`db:setup` aplica migrações SQLite e corre o seed (contas demo + direcao@epgerabriel.edu.pt).

API: `http://localhost:3001` · Health: `GET /health`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Web: `http://localhost:5173` — ver também [`frontend/PREVIEW.md`](frontend/PREVIEW.md)

### Build de verificação

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Contas de acesso

| Email | Password | Papel |
|-------|----------|-------|
| direcao@epgerabriel.edu.pt | direcao2026 | ADMIN (ATIVO) — conta principal |
| admin.demo@epgerabriel.edu.pt | Admin123! | ADMIN (ATIVO) — demo |
| aluno.demo@epgerabriel.edu.pt | Aluno123! | ALUNO (ATIVO) |
| pendente.demo@epgerabriel.edu.pt | Aluno123! | ALUNO (PENDENTE) |

Não utilizar dados pessoais reais. O registo público está desactivado; novas contas são criadas no painel de administração.

## Equipa e processo Git

| Nome | Papel | GitHub |
|------|-------|--------|
| Gabriel | Desenvolvimento | Gcango |
| Geraldo (Sense) | Desenvolvimento | main_sense |

Fluxo: **Issue → branch `feature/USxx-...` → Pull Request → code review → merge**.

Templates: [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md), issues em [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/).

## Licença e contexto académico

Projeto desenvolvido no âmbito de formação / projeto integrador. O **processo** (documentação, Git, Kanban, segurança) é parte da avaliação, tal como o protótipo funcional.
