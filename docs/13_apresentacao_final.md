# 13 — Apresentação final (roteiro)

**Duração sugerida:** 15–20 minutos + perguntas  
**Equipa:** Gabriel e Sense · Chat_Nações — Comunidade Digital Escolar

---

## 1. Abertura (1 min)

- Cliente fictício: Escola (EP Gabriel / GERABRIEL)
- Problema: comunicação fora de canais controlados
- Objetivo: comunidade privada, segura e moderada

## 2. Processo de engenharia (3 min)

- Não começámos «a codar» sem análise — ver [`docs/`](.) (itens 1–10 do enunciado)
- GitHub: Issues, branches, PRs, code review
- Kanban: ligar Issues ao quadro do GitHub Projects

## 3. Utilizadores e permissões (2 min)

- Aluno, Professor, Administrador
- Validação: email `@epgerabriel.edu.pt`, contas criadas pela escola (sem registo público)
- Estados: `PENDENTE`, `ATIVO`, `SUSPENSO`, `BLOQUEADO`

## 4. Demonstração ao vivo (8 min)

Ordem alinhada ao enunciado:

1. **Login** (aluno demo)
2. **Perfil** — consulta/edição
3. **Feed** — publicações, autor, data
4. **Nova publicação** — texto (+ tipos notícia/projeto/evento se aplicável)
5. **Comentário e reação**
6. **Denúncia** — motivo (bullying, spam, etc.)
7. **Admin** — fila de denúncias, aprovar pendente, remover conteúdo

Ter backend e frontend a correr; plano B: capturas de ecrã em [`06_mockups.md`](./06_mockups.md).

## 5. Arquitetura e segurança (2 min)

- Diagrama em [`04_arquitetura.md`](./04_arquitetura.md)
- JWT, bcrypt, RBAC, rate limit login, domínio email no servidor
- RGPD: dados fictícios na demo — [`SECURITY.md`](../SECURITY.md)

## 6. Moderação e IA (2 min)

- Denúncias humanas + auditoria
- IA: **roadmap** — sinalização para revisão, sem auto-remoção ([`10_decisoes_tecnicas.md`](./10_decisoes_tecnicas.md))

## 7. Testes e qualidade (1 min)

- Casos em [`08_testes.md`](./08_testes.md) e [`tests/test_cases.md`](../tests/test_cases.md)
- O que foi testado manualmente vs automatizado

## 8. Retrospetiva e próximos passos (2 min)

- O que correu bem / melhorar — [`09_retrospectiva.md`](./09_retrospectiva.md)
- Roadmap: media (foto/vídeo), calendário institucional, IA — [`14_estado_implementacao_e_roadmap.md`](./14_estado_implementacao_e_roadmap.md)

## 9. Encerramento

- Repositório, README, entregáveis 1–13 — [`00_mapa_entregaveis.md`](./00_mapa_entregaveis.md)

---

### Checklist antes da apresentação

- [ ] `npm run dev` backend + frontend testados
- [ ] Seed com dados demo
- [ ] Slides ou demo browser preparados
- [ ] Links GitHub Issues/PRs exportados (PDF ou capturas) para entregável 9
