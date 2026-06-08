# Poverty Insights Dissertation Project

Poverty Insights is a final-year dissertation website focused on poverty analysis in Mauritius. It combines official poverty indicators, district development evidence, analytics, and a natural-language assistant in a deployable full-stack application.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: SQLite
- Deployments:
  - Frontend on Vercel
  - Backend on Railway

## Project structure

- `frontend/`: user-facing website
- `backend/`: API, SQLite setup, data access, and analytics logic
- `shared/`: shared API contracts
- `docs/`: deployment and database notes

## Run locally

Fresh setup on another laptop:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

This installs backend and frontend dependencies, creates a local `backend/.env` from the safe example if needed, and initializes the SQLite database. Node.js 22 or newer is required.

Backend:

```bash
cd backend
npm install
npm run db:init
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment variables

Backend:
- `GEMINI_API_KEY`
- `PORT` or `API_PORT`
- optional `DATABASE_DIR`
- optional `SQLITE_PATH`
- optional `CORS_ORIGINS`

Frontend:
- no required runtime environment variables by default

## Deployment notes

See:
- `docs/deploy-vercel-railway.md`
- `docs/database.md`
