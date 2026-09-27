# 14 — Estado da implementação e roadmap

Comparação honesta entre o **enunciado do projeto integrador** e o protótipo atual (branch `main_sense`).

## Proposta da equipa (decisões já documentadas)

| Tema | Decisão |
|------|---------|
| Validação de identidade | Registo **only-by-admin**; email obrigatoriamente `@epgerabriel.edu.pt`; nº aluno único; contas demo fictícias |
| Arquitetura | SPA React + API REST Express + Prisma + SQLite (dev) |
| Feed | Cronológico (desc), tipos de post: normal, notícia, projeto, evento |
| Moderação | Denúncias com motivos do enunciado; fila admin; remoção lógica de posts/comentários |
| IA | Fase futura: flag de texto/imagem para revisão humana (RF14) |

Detalhe: [`10_decisoes_tecnicas.md`](./10_decisoes_tecnicas.md).

## Requisito mínimo obrigatório (secção 9 do enunciado)

| Etapa | Estado | Notas |
|-------|--------|-------|
| Registo | Feito | Via painel admin (equivalente a «registo validado pela escola») |
| Autenticação | Feito | JWT, rate limit, bloqueio por estado da conta |
| Perfil | Feito | Ver/editar bio; dados escolares no perfil |
| Publicação | Feito | Texto; media em evolução |
| Feed | Feito | Lista com autor, data, interações |
| Comentário / reação | Feito | LIKE (extensível a LOVE/SUPPORT no modelo) |
| Denúncia | Feito | Modal com motivos enum |
| Análise da denúncia | Feito | AdminPage + API reports/admin |

## Funcionalidades do enunciado — matriz

| Área | Enunciado | Estado |
|------|-----------|--------|
| Aluno: foto/vídeo em posts | Sim | **Parcial** — modelo/UI a completar |
| Professor: projetos | Sim | **Parcial** — tipo `PROJETO` no backend |
| Admin: notícias/eventos/calendário | Sim | **Parcial** — páginas comunidade + tipos de post; calendário dedicado a evoluir |
| Denúncias + motivos | Sim | **Feito** |
| Suspender/bloquear conta | Sim | **Parcial** — API; UI admin a polir |
| IA moderación | Avançado | **Não iniciado** (planeado) |
| Auditoria moderação | Segurança | **Parcial** — verificar `AuditLog` vs fluxos admin |
| Portal institucional público | Extra (não no MVP mínimo) | Fora do commit base atual; pode existir em branches locais |

## Prioridades profissionais (próximas sprints)

Sugerido converter cada linha numa **Issue GitHub** e mover no Kanban.

### Sprint A — Fechar MVP «nota 20» no enunciado

1. **US09** — Upload imagem em publicação (validação MIME, tamanho, pasta `uploads/`)
2. **US10** — Suspender conta na UI admin (ligar à API existente)
3. **US11** — Capturas de ecrã no [`06_mockups.md`](./06_mockups.md) + 2 min de vídeo demo

### Sprint B — Cliente escolar (valor institucional)

4. **US12** — Calendário escolar (admin publica, alunos consultam)
5. **US13** — Feed: destacar notícias oficiais (pin ou secção)
6. **US14** — Relatório de testes executado ([`08_testes.md`](./08_testes.md))

### Sprint C — Componente avançada (IA)

7. **US15** — Pipeline: ao criar post/comentário, score de risco textual → flag `needsReview` para admin
8. Documentar limitações éticas e RGPD no [`SECURITY.md`](../SECURITY.md)

## Qualidade e entrega académica

- Cada US: branch `feature/USxx-descricao` → PR → review → merge
- Atualizar [`07_backlog.md`](./07_backlog.md) e [`12_worklog_equipa.md`](./12_worklog_equipa.md) semanalmente
- Entregável 9: exportar lista de Issues/PRs fechados na data da entrega
