# 02 — Requisitos

## Funcionais

| Código | Requisito | Prioridade |
|--------|-----------|------------|
| RF01 | **Escola (admin)** cria contas com nome, email `@epgerabriel.edu.pt`, nº aluno, curso, turma e palavra-passe | Must |
| RF02 | Rejeitar email se o domínio não for institucional | Must |
| RF03 | Registo público desactivado; contas admin nascem `ATIVO`; legado `PENDENTE` até aprovação | Must |
| RF04 | Autenticar com email e palavra-passe (JWT) | Must |
| RF05 | Bloquear login de contas `PENDENTE`, `SUSPENSO` ou `BLOQUEADO` | Must |
| RF06 | Consultar e editar perfil (bio, avatar opcional) | Must |
| RF07 | Criar publicação com texto (imagem/vídeo em evolução) | Must |
| RF08 | Feed paginado após login | Must |
| RF09 | Comentar e reagir a publicações | Must |
| RF10 | Denunciar conteúdo com motivo (bullying, insulto, ameaça, etc.) | Must |
| RF11 | Admin: fila de denúncias e resolução | Must |
| RF12 | Admin: aprovar registos pendentes | Must |
| RF13 | Admin: remover publicação/comentário e suspender conta | Must |
| RF14 | IA (opcional): sinalizar texto para revisão humana, sem remoção automática | Could |

## Não funcionais

| Código | Requisito | Prioridade |
|--------|-----------|------------|
| RNF01 | Passwords com hash bcrypt; nunca em claro | Must |
| RNF02 | RBAC: ALUNO, PROFESSOR, ADMIN | Must |
| RNF03 | Rate limit em login | Should |
| RNF04 | RGPD: dados mínimos; demo só contas fictícias | Must |
| RNF05 | Upload com limites de tamanho e tipos MIME | Should |
| RNF06 | UI responsiva e acessível (labels, contraste) | Should |
| RNF07 | Processo Git: Issue → branch → PR → review | Must |

## Regras de negócio

- RN01: Email deve terminar em `epgerabriel.edu.pt`.
- RN02: Nº de aluno único por conta.
- RN03: Utilizador `PENDENTE` / `SUSPENSO` / `BLOQUEADO` não acede ao feed; só `ATIVO`.
- RN04: Decisão de moderação registada (auditoria).
- RN05: Login público; acesso ao frontend só após autenticação; ajuda «palavra-passe esquecida» orienta contacto com a escola.
