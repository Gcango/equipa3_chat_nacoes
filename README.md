# Chat_Nações 🏫💬

> Rede social privada para a **Escola Profissional do Fundão** — só entra quem tem email `@epfundao.edu.pt`.

![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-FFCA28?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 Sobre o projeto

**Chat_Nações** é uma rede social **privada e segura** criada para a comunidade escolar da **Escola Profissional do Fundão**. O objetivo é oferecer um espaço controlado onde alunos, professores e administradores podem comunicar, partilhar conteúdo e interagir — sem os riscos das redes sociais públicas.

### 🎯 Regra fundamental

Só é possível registar com um **email escolar válido** (`@epfundao.edu.pt`) e o email tem de ser **verificado**. Isto garante que apenas membros reais da comunidade escolar têm acesso.

---

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Registo com validação de **email escolar** (`@epfundao.edu.pt`)
- **Verificação de email** obrigatória (link enviado pelo Firebase)
- Login bloqueia **emails não verificados** e **contas banidas**
- Persistência de sessão (utilizador continua autenticado após fechar a app)
- Controlo de **permissões por role** (aluno / professor / admin)
- **Firestore Rules** validam tudo no servidor (não só no cliente)

### 👤 Perfil
- Avatar com **upload de foto**
- Edição de **nome** e **bio**
- Contadores em tempo real: publicações · seguidores · a seguir
- Grid 3x3 de publicações (estilo Instagram)
- Aba de Reels com thumbnails reais

### 📝 Publicações
- Criar posts com **texto + até 10 imagens**
- Carrossel deslizável com contador (1/5, 2/5…)
- Ecrã individual do post
- **Apagar** o próprio post (com confirmação)
- **Denunciar** publicações de outros

### ❤️ Interações
- **Likes** com atualização em tempo real
- **Comentários** com respostas encadeadas
- **Notificações** automáticas (likes, comentários, respostas, seguidores)

### 👥 Sistema de seguir
- Botão com **3 estados**: Seguir / Seguir de volta / A seguir
- Lista de seguidores e lista de quem segues
- Notificação automática ao ser seguido

### 📸 Stories
- Criar story com **foto**
- Expiração automática ao fim de **24 horas**
- **Hold to pause** (segurar para pausar)
- Agrupamento por autor (1 círculo por pessoa)
- **Lista de quem visualizou** (só o autor vê)
- Contagem de visualizações no fundo
- Apagar o próprio story

### 🎬 Reels
- Vídeos até **60 segundos** (máx. 25 MB)
- **Thumbnail automática** extraída do vídeo
- Player vertical com swipe up/down
- **Autoplay** apenas do reel visível
- Som desligado por omissão (botão para ativar)
- Grid 3x3 no perfil com thumbnails reais

### 💬 Mensagens (Direct)
- Conversas 1:1 em **tempo real**
- Badge de **não lidas** na tab bar
- Indicador **✓ enviada / ✓✓ vista**
- Abrir conversa pelo perfil de outro utilizador

### 🚨 Moderação
- Sistema de **denúncias** com 5 motivos
- Painel de **administração** com:
  - Estatísticas em tempo real
  - Lista de denúncias com filtros
  - Ações: ignorar / remover conteúdo / banir utilizador
  - Gestão de utilizadores (promover / rebaixar / banir / desbanir)

### 🔍 Pesquisa
- Procurar utilizadores por **nome** ou **username**
- Grid de exploração com posts + reels

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React Native + Expo SDK 57 |
| **Rotas** | Expo Router (file-based routing) |
| **Linguagem** | TypeScript |
| **Backend** | Firebase |
| **Autenticação** | Firebase Auth + Identity Platform |
| **Base de dados** | Cloud Firestore |
| **Armazenamento** | Firebase Storage |
| **Funções** | Cloud Functions (Node.js 20, 1ª geração) |
| **Vídeo** | expo-video + expo-video-thumbnails |
| **Imagem** | expo-image-picker |
| **Estado** | React Hooks + onSnapshot (tempo real) |

---