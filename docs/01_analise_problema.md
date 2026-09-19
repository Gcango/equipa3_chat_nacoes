# 01 — Análise do Problema

## Cliente

Escola (EP Gabriel) — comunidade educativa privada na plataforma **Chat_Nações — Comunidade Digital Escolar**.

## Problema atual

Alunos usam redes sociais externas para comunicar e partilhar conteúdos escolares. A escola não controla privacidade, moderação nem adequação ao contexto educativo.

## Objetivo da solução

Rede social **privada** onde:

- só entram membros validados (email `@epgerabriel.edu.pt`);
- alunos e professores interagem (publicações, comentários, reações);
- a escola divulga notícias, projetos e eventos;
- existem denúncias e moderação humana para ambiente seguro.

## Utilizadores

| Perfil | Necessidades principais |
|--------|------------------------|
| **Aluno** | Registo, perfil, feed, publicar, comentar, reagir, denunciar |
| **Professor** | Igual ao aluno + publicações institucionais/projetos |
| **Administrador/Moderador** | Aprovar registos, moderar denúncias, remover conteúdo, suspender contas |

## Necessidades

- Validação de identidade no registo (email escolar, nº aluno, curso, turma).
- Fluxo MVP: registo → autenticação → perfil → publicação → feed → comentário/reação → denúncia → análise.
- Segurança: passwords protegidas, papéis (RBAC), sem dados reais na demo.

## Fora do MVP

- Chat privado em tempo real.
- Notificações push.
- Integração Active Directory.
- Moderação automática de vídeo frame a frame.

## Perguntas ao cliente

- Feed estritamente cronológico ou notícias oficiais fixadas no topo?
- Professores registam-se sozinhos ou só por convite do admin?
- Prazo para aprovação manual de contas `PENDENTE`?
