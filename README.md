# Iglesia Bautista Bíblica — Grand Rapids

Rediseño del sitio web oficial de la Iglesia Bautista Bíblica de Grand Rapids, Michigan.

**Live preview:** https://ibbgrmi.github.io/iglesia-bautista-biblica/
**Production (after CNAME swap):** https://iglesia-bautista-biblica.org

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM 6 |
| Auth + DB | Supabase (REST + Auth, direct fetch, no SDK) |
| Hosting | GitHub Pages (deploy from `gh-pages` branch) |
| CI | GitHub Actions on push to `main` |
| Email notifications | Google Apps Script web app (Supabase webhook target) |

## Local dev

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. The dev server reads env vars from `.env.production` by default (since they're public-safe). Override locally with `.env.local` if needed.

## Deploy

Push to `main` → GitHub Actions builds and deploys to `gh-pages` branch automatically. The live site updates within ~60 seconds.

## Environment variables

| Variable | Where it lives | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.production` (committed) | Public-safe, ships in client JS |
| `VITE_SUPABASE_ANON` | `.env.production` (committed) | Public-safe; data security comes from RLS policies on each table |
| `VITE_BASE_PATH` | optional override | Default `/iglesia-bautista-biblica/`. Set to `/` after custom-domain swap. |

The Apps Script email-gateway URL is **not** stored here — it lives only in Supabase's Database Webhook config so it never ships to clients.

## Structure

```
src/
├── main.tsx            # entry — wraps app in <BrowserRouter> + <AuthProvider>
├── App.tsx             # route table
├── HomePage.tsx        # / — public landing
├── LoginPage.tsx       # /login — admin sign-in
├── AdminPage.tsx       # /admin — protected
├── AuthContext.tsx     # session state + signIn/signOut
├── supabase.ts         # REST client (auth + dbSelect/Insert/Update/Delete)
├── index.css           # Tailwind directives + global styles
└── vite-env.d.ts       # env-var TypeScript types
```

## Custom domain swap (when ready to go live)

1. Add `CNAME` file at repo root containing `iglesia-bautista-biblica.org`
2. In `.env.production`, add `VITE_BASE_PATH=/`
3. Remove `CNAME` from the old `ibbgrmi/iglesia-website` repo
4. Wait ~10 min for GitHub Pages to repropagate
5. Archive `ibbgrmi/iglesia-website`
