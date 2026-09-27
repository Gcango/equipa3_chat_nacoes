# Enunciado do Projeto Integrador

**Equipa:** Gabriel e Sense  
**Produto:** Chat_Nações — Comunidade Digital Escolar

---

## 1. Contexto do cliente

A Escola pretende criar um espaço digital **privado** destinado à sua comunidade escolar. Atualmente, os alunos recorrem frequentemente a redes sociais externas para comunicar, partilhar ideias, fotografias, vídeos, projetos e acontecimentos escolares. A Escola considera útil possuir uma plataforma própria, onde possa simultaneamente:

- promover interação entre alunos;
- divulgar projetos;
- partilhar notícias;
- divulgar eventos;
- publicar calendário;
- promover atividades escolares.

A plataforma deverá funcionar como uma **comunidade digital escolar privada**.

## 2. Problema apresentado pelo cliente

A Escola pretende contratar uma equipa de desenvolvimento para criar uma aplicação na qual os alunos possam participar numa rede social **restrita à comunidade educativa**. A preocupação principal é proporcionar interação, mantendo simultaneamente um **ambiente seguro**.

## 3. Registo dos utilizadores

Evitar acesso livre de pessoas externas. Mecanismos de validação da identidade. O registo poderá considerar:

- nome;
- email escolar;
- número de aluno;
- curso;
- turma;
- palavra-passe.

A equipa deverá **propor** uma forma adequada de validação.

## 4. Utilizadores principais

### Aluno

- criar e editar perfil;
- consultar publicações;
- criar publicações;
- publicar texto, fotografias, vídeos;
- comentar, reagir, denunciar conteúdos.

### Professor

- consultar a comunidade;
- publicar conteúdos;
- divulgar projetos;
- interagir com publicações;
- reportar conteúdos inadequados.

### Administrador / Escola

- gerir utilizadores;
- publicar notícias, eventos, calendário;
- moderar conteúdos;
- analisar denúncias;
- remover publicações;
- bloquear ou suspender contas.

## 5. Feed de publicações

Após login: publicações com texto, imagem, vídeo, autor, data, comentários e reações.

## 6. Moderação

Denunciar conteúdos; analisar denúncias; remover conteúdos; medidas sobre contas. Motivos exemplificativos: bullying, insulto, ameaça, conteúdo ofensivo/impróprio, spam, outro.

## 7. Inteligência Artificial

Componente avançada: apoio à moderação (palavras ofensivas, bullying, texto/imagem inadequados). **Apoio humano**, não substituição automática da decisão.

## 8. Segurança

Autenticação, proteção de contas, privacidade, permissões, RGPD, passwords, controlo de acessos, ficheiros, registo de ações, moderação.

## 9. Requisitos mínimos obrigatórios (protótipo)

Demonstrar:

**Registo → autenticação → perfil → publicação → feed → comentário/reação → denúncia → análise da denúncia**

Com: interface gráfica, base de dados, utilizadores, publicações, comentários, reações, denúncias, área admin/moderação.

## 10. Desafio da equipa

Analisar, projetar e desenvolver uma comunidade digital privada com interação, divulgação institucional, segurança e moderação.

## 11. O cliente não definiu

A equipa propõe: arquitetura, tecnologias, BD, organização do feed, permissões, armazenamento de media, política de moderação, IA, segurança.

---

## Regras de execução

**Antes da implementação**, produzir:

1. Análise do problema  
2. Identificação dos utilizadores  
3. Requisitos funcionais  
4. Requisitos não funcionais  
5. Casos de utilização  
6. Modelo de dados  
7. Protótipo das interfaces  
8. Arquitetura proposta  
9. Backlog inicial  
10. Planeamento das tarefas  

Só depois iniciar o desenvolvimento.

---

## Entregáveis finais

| Nº | Entregável |
|----|------------|
| 1 | Documento de análise do problema |
| 2 | Requisitos funcionais e não funcionais |
| 3 | Casos de utilização |
| 4 | Diagrama/modelo da base de dados |
| 5 | Mockups ou protótipos das interfaces |
| 6 | Repositório GitHub |
| 7 | Código-fonte |
| 8 | README completo |
| 9 | Evidências de Issues, branches e Pull Requests |
| 10 | Aplicação/protótipo funcional |
| 11 | Relatório breve de testes |
| 12 | Apresentação final |
| 13 | Retrospetiva da equipa |

## Ferramentas mínimas

Git, GitHub, Issues, branches, commits, Pull Requests, code review, README, quadro Kanban (ou equivalente).

## Critério de avaliação

Não é só a aplicação funcional: também a organização do trabalho, comunicação, documentação de decisões, controlo de versões, gestão de tarefas e práticas de segurança. **O processo faz parte do produto final.**

---

Ver [`00_mapa_entregaveis.md`](./00_mapa_entregaveis.md) para localizar cada entregável neste repositório.
