Frontend on Vercel, backend on Railway

1. Backend on Railway
- Deploy the `backend` folder from GitHub.
- Build command: `npm install`
- Start command: `node --experimental-strip-types src/index.ts`
- Set environment variables:
  - `NODE_ENV=production`
  - `GEMINI_API_KEY=...`
  - optional `CORS_ORIGINS=https://your-vercel-domain.vercel.app`
- The backend now supports Railway's `PORT` automatically.
- Local `.env` files should not be committed. Use `backend/.env.example` as the safe reference.

2. Persistent SQLite
- Add a Railway volume and mount it to a stable path.
- Recommended mount path:
  - `/app/backend/data/database`
- Then set:
  - `DATABASE_DIR=/app/backend/data/database`
- Optional alternative:
  - `SQLITE_PATH=/app/backend/data/database/poverty-insights.sqlite`

3. Verify backend
- Open:
  - `/api/health`
  - `/api/dashboard`
  - `/api/analytics`

4. Frontend on Vercel
- Import the repo and set Root Directory to `frontend`.
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

5. Frontend to backend connection
- If frontend still calls relative `/api/...`, add a Vercel rewrite so `/api/*` proxies to the Railway backend domain.
