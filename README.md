# Atv-2-QA — Kanban Board

## Tecnologias

- **TypeScript** — Linguagem principal
- **Vite** — Bundler e dev server do frontend
- **Express** — Servidor backend (API REST)
- **Better-SQLite3** — Banco de dados local
- **ESLint** — Análise estática de código

---

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em: **http://localhost:5173**

---

## Scripts

| Comando                | O que faz                            |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Sobe frontend + backend juntos       |
| `npm run dev:frontend` | Só o Vite (frontend)                 |
| `npm run dev:backend`  | Só o servidor Express                |
| `npm run build`        | Gera o build de produção             |
| `npm run lint`         | Roda o ESLint em `src/` e `backend/` |
| `npm run preview`      | Visualiza o build localmente         |

---

## Portas

| Serviço           | Porta  |
| ----------------- | ------ |
| Frontend (Vite)   | `5173` |
| Backend (Express) | `3000` |
