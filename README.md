# SeedhaHisaab — Frontend (React + Vite + Tailwind)

Web client for the SeedhaHisaab transaction-based financial management app.

- **Stack:** React 19 · Vite 7 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · React Router v6 · React Hook Form · Zod · Axios · TanStack Query
- **Backend repo:** https://github.com/akuma-Dhruv/seedhaHissab-backend

---

## ⚠️ Important — first-time setup

This project was originally developed inside a **pnpm monorepo workspace** on Replit.
That means the `package.json` in this repo currently uses two special pnpm
features that do NOT work outside that workspace:

1. `"catalog:"` references — pnpm looks up the real version in a shared
   `pnpm-workspace.yaml` file that doesn't exist here.
2. `"workspace:*"` references — these point at sibling packages inside the
   monorepo.

Before running `npm install` / `pnpm install` for the first time, you must
**replace these references with real versions** in `package.json`. Do this
exactly once and commit the result.

### Step-by-step fixes for `package.json`

#### 1. Replace every `"catalog:"` value with a real version

Open `package.json` and change each line on the left to the value on the right:

| Package | New version |
|---|---|
| `@replit/vite-plugin-cartographer` | `^0.5.1` |
| `@replit/vite-plugin-dev-banner` | `^0.1.1` |
| `@replit/vite-plugin-runtime-error-modal` | `^0.0.6` |
| `@tailwindcss/vite` | `^4.1.14` |
| `@tanstack/react-query` | `^5.90.21` |
| `@types/node` | `^25.3.3` |
| `@types/react` | `^19.2.0` |
| `@types/react-dom` | `^19.2.0` |
| `@vitejs/plugin-react` | `^5.0.4` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `framer-motion` | `^12.23.24` |
| `lucide-react` | `^0.545.0` |
| `react` | `19.1.0` |
| `react-dom` | `19.1.0` |
| `tailwind-merge` | `^3.3.1` |
| `tailwindcss` | `^4.1.14` |
| `vite` | `^7.3.0` |
| `zod` | `^3.25.76` |

So for example, this:

```json
"react": "catalog:",
```

becomes:

```json
"react": "19.1.0",
```

#### 2. Delete this line entirely

```json
"@workspace/api-client-react": "workspace:*",
```

The frontend code does **not** import from this package, so removing it is safe.

#### 3. (Optional) Rename the package

At the top of `package.json`, change:

```json
"name": "@workspace/seedhahisaab",
```

to a normal name like:

```json
"name": "seedhahisaab-frontend",
```

The `@workspace/...` prefix only matters inside the original Replit monorepo.

---

## Running locally

After you've finished the `package.json` fixes above:

```bash
# 1. Install dependencies (npm, pnpm, or yarn — all work)
npm install

# 2. The Vite dev server requires PORT and BASE_PATH env vars
#    (see vite.config.ts). On Linux/macOS:
export PORT=5173
export BASE_PATH=/

#    Or on Windows PowerShell:
#    $env:PORT="5173"; $env:BASE_PATH="/"

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

The dev server proxies `/api/*` requests to `http://localhost:8080`, so make
sure the [backend](https://github.com/akuma-Dhruv/seedhaHissab-backend) is
running there.

---

## Available scripts

| Command            | What it does                                    |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Start the Vite dev server (with HMR)            |
| `npm run build`    | Production build into `dist/public/`            |
| `npm run serve`    | Preview the production build locally            |
| `npm run typecheck`| Run the TypeScript compiler in no-emit mode     |

---

## Project layout

```
.
├── index.html            # Vite entry HTML
├── vite.config.ts        # Vite config (dev proxy /api -> :8080 lives here)
├── tsconfig.json         # TypeScript config
├── components.json       # shadcn/ui config
└── src/
    ├── App.tsx           # React Router v6 root
    ├── main.tsx          # React entry
    ├── lib/
    │   └── api.ts        # Axios instance (baseURL = "/api")
    ├── components/       # Reusable UI (shadcn primitives + app components)
    └── pages/            # Route components (login, signup, history, etc.)
```

---

## Configuring the API URL

The Axios client is hard-coded to `baseURL: "/api"` (see `src/lib/api.ts`)
and relies on Vite's dev proxy in development. If you deploy the frontend
on a different origin from the backend, you have two options:

1. **Same origin (recommended):** put both behind one reverse proxy
   (e.g. nginx) so `/api/*` is forwarded to the Spring Boot service.
2. **Different origin:** edit `src/lib/api.ts` to point at the absolute
   backend URL (e.g. `baseURL: "https://api.example.com/api"`) and make
   sure `CORS_ALLOWED_ORIGIN` on the backend matches your frontend origin.

---

## Tech notes

- Tailwind v4 is used via `@tailwindcss/vite` — there is no `tailwind.config.js`.
  Theme tokens live in CSS via `@theme { ... }`.
- shadcn/ui components are pre-installed under `src/components/ui/`. To add
  more, see https://ui.shadcn.com.
