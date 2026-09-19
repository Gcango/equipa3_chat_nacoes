# Pré-visualizar o site (Go Live)

O frontend usa **Vite** com recarregamento automático: cada alteração que guardes no código aparece no browser em segundos.

## 1. Arrancar API + site

**Terminal 1 — backend** (obrigatório para login/registo):

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend (Go Live):**

```bash
cd frontend
npm run dev
```

O browser abre em **http://localhost:5173** (configurado em `vite.config.ts`).

## 2. No Cursor / VS Code

- **Simple Browser:** `Cmd+Shift+P` → *Simple Browser: Show* → `http://localhost:5173`
- **Portas:** painel *Ports* / encaminhamento — expõe a porta **5173** se quiseres ver noutro dispositivo na rede (`host: true` no Vite).

## 3. Extensão “Live Preview” (opcional)

Para HTML estático. Este projeto é **React + Vite** — usa sempre `npm run dev` no `frontend/` para ver alterações com HMR.

## 4. Logotipo

Ficheiro: [`public/logo-gerabriel.png`](public/logo-gerabriel.png)  
Componente: `src/components/LogoBrand.tsx`

- `logo-gerabriel.png` — **versão oficial** (prata + azul elétrico); cabeçalho escuro para contraste
- Substituir o PNG se a escola enviar versão vectorial/SVG ou PNG já recortado
