# 08 — Testes

## Plano manual (MVP)

| ID | Caso | Passos | Resultado esperado |
|----|------|--------|-------------------|
| T01 | Registo público | POST `/auth/register` ou UI | 403 / redirect login |
| T02 | Admin cria conta | Admin → criar conta `@epgerabriel.edu.pt` | Conta `ATIVO` |
| T03 | Login pendente | `pendente.demo@…` / `Aluno123!` | Recusado (conta não activa) |
| T04 | Login activo | `aluno.demo@…` / `Aluno123!` | Feed acessível |
| T05 | Publicar + feed | Criar post no feed | Post visível com autor e data |
| T06 | Comentar / gostar | Abrir comentários; gostar | Contadores actualizam |
| T07 | Denunciar | Denunciar → modal → motivo | Toast sucesso; admin vê fila |
| T08 | Moderação | Admin remove publicação | Post deixa feed; denúncia resolvida |
| T09 | RBAC admin | Aluno acede `/admin` | Redirect ou sem acesso |
| T10 | Perfil | Editar bio | Guardado via `/users/me` |
| T11 | Ajuda palavra-passe | Link no login | Página `/login/palavra-passe` |
| T12 | Rodapé cofinanciamento | Após login, scroll rodapé | Faixa Portugal 2030 visível |

Registar data e responsável em [`12_worklog_equipa.md`](12_worklog_equipa.md).
