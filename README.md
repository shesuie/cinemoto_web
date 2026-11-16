# CINEMO'TO Web (`cinemoto_web`)

React + Vite SPA for CINEMO'TO v2. Talks to `cinemoto_api` over Sanctum cookie auth (CSRF + session).

## Prerequisites

- Node.js **18+** (LTS recommended) and npm
- API running at `http://127.0.0.1:8001` (see `../cinemoto_api/README.md`)
- MariaDB/MySQL for the API (frontend does not connect to the DB directly)

No XAMPP Apache is required for the frontend.

## First-time setup

```powershell
cd cinemoto_web
copy .env.example .env
npm install
```

`.env` (do not commit):

```
VITE_API_URL=http://localhost:8001
```

Use the same host the browser can reach for the API. After changing `VITE_*` values, restart Vite.

## Run (development)

Start the API in one terminal, then:

```powershell
cd cinemoto_web
npm run dev
```

App URL: **http://localhost:5173**

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |

## How it connects to the API

- Axios calls go to `VITE_API_URL` (`/api/v1/...`).
- Auth is **cookie + CSRF**, not Bearer tokens. The SPA must share a stateful domain with Sanctum (see `SANCTUM_STATEFUL_DOMAINS` in the API `.env`).
- Default local pair: web `localhost:5173` ↔ API `localhost:8001`.

## Project layout (high level)

| Path | Role |
|------|------|
| `src/pages/` | Customer + admin screens |
| `src/components/` | Shared UI (e.g. seat layout, QR check-in) |
| `src/routes/AppRoutes.jsx` | Route map |
| `src/` | API client, auth store, hooks |

## Secrets / GitHub

| File | Commit? |
|------|---------|
| `.env` | **No** |
| `.env.example` | **Yes** |
| `node_modules/` | **No** (install with `npm install`) |
| `dist/` | **No** (from `npm run build`) |

## Troubleshooting

- Blank page / failed login: confirm API is up on `:8001` and `VITE_API_URL` matches.
- CORS / CSRF errors: check API `FRONTEND_URL` and `SANCTUM_STATEFUL_DOMAINS` include `localhost:5173`.
- Port in use: stop the other Vite process or change Vite’s port in config / CLI.
