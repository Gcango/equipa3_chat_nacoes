# 11 — Backlog Inicial Sugerido

Transformar cada item numa Issue do GitHub.

## US01 — Contas criadas pela escola (admin)

Como administração, quero criar contas escolares `@epgerabriel.edu.pt` para alunos.

### Critérios de aceitação

- [x] Formulário admin: nome, email, nº aluno, curso, turma, password (mín. 8)
- [x] Email rejeitado se domínio ≠ `epgerabriel.edu.pt`
- [x] Nº aluno único
- [x] Conta criada com status `ATIVO`
- [x] Registo público desactivado (403)

## US02 — Implementar autenticação

Como utilizador, quero iniciar sessão de forma segura.

### Critérios de aceitação

- [x] Login com email + password
- [x] JWT devolvido apenas se status `ATIVO`
- [x] Mensagem genérica se credenciais inválidas ou conta inactiva
- [x] Rate limit no endpoint de login
- [x] Ecrã login isolado; ajuda palavra-passe esquecida

## US03 — Criar perfil

Como utilizador, quero consultar e editar o meu perfil.

### Critérios de aceitação

- [x] Ver nome, curso, turma, bio
- [x] Editar bio (próprio perfil)
- [x] GET `/users/me` autenticado

## US04 — Criar publicação

Como aluno, quero publicar texto (futuro: imagem/vídeo).

### Critérios de aceitação

- [x] Criar post com texto não vazio
- [x] Só utilizador `ATIVO`
- [x] Autor associado ao post

## US05 — Implementar feed

Como utilizador, quero consultar publicações da comunidade.

### Critérios de aceitação

- [x] Lista ordenada por data (desc)
- [x] Mostra autor e data
- [x] Limite 50 publicações (nota no UI)

## US06 — Comentários e reações

Como utilizador, quero comentar e reagir a publicações.

### Critérios de aceitação

- [x] Adicionar comentário
- [x] Reagir (LIKE) — uma reação por user/post

## US07 — Denunciar conteúdo

Como utilizador, quero denunciar conteúdo inadequado.

### Critérios de aceitação

- [x] Escolher motivo da lista do enunciado (modal)
- [x] Denúncia fica `ABERTA`

## US08 — Painel de moderação

Como administrador, quero analisar denúncias e tomar decisões.

### Critérios de aceitação

- [x] Listar denúncias abertas (com excerto do post)
- [x] Aprovar utilizadores pendentes
- [x] Remover post / resolver / rejeitar denúncia
- [ ] Suspender conta do autor (API pronta; UI em evolução)
