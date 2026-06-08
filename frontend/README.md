# Poverty Insights Frontend

This frontend is the React + TypeScript interface for the Mauritius poverty analysis dissertation project.

## Purpose

It presents:
- dashboard indicators and source publications
- analytics and forecast outputs
- district map views
- dataset previews for transparency and reproducibility
- the Gemini-backed `Talk to Data` assistant

## Local development

From the `frontend` directory:

```bash
npm install
npm run dev
```

This starts Vite and proxies API requests to the backend during local development.

## Build

```bash
npm install
npm run build
```

The production build output is written to `dist/`.

## Deployment

- Frontend: Vercel
- Backend API: Railway
- API proxy rewrite: configured in `vercel.json`

See the project-level deployment notes in `../docs/deploy-vercel-railway.md`.
