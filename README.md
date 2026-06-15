# form-craft-ai

The verified **baseline** for an AI form builder: Next.js 16 (App Router) on
Cloudflare Workers (OpenNext), Tailwind v4 + shadcn/ui, next-intl (`app/[locale]`,
`en` only), Biome, and Playwright.

**The product is built on top of this baseline by a separate implementation prompt**
(database, auth, AI, the form builder, Hebrew/RTL, theme toggle). This repo is just
the foundation — it boots under the real Cloudflare runtime and nothing more.

## Prerequisites

- Node 24 (see `.nvmrc`) · pnpm 11 (`corepack enable`)

## Setup

```bash
pnpm install
pnpm test:e2e:install   # one-time: Playwright Chromium (needs sudo for system deps)
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server — http://localhost:3000 |
| `pnpm build` | `next build` (fast gate; not the Worker bundle) |
| `pnpm preview` | Build + serve on Cloudflare **workerd** — http://localhost:8787 (the real runtime) |
| `pnpm deploy` | Build + deploy to Cloudflare |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | Types · Biome check · Biome write |
| `pnpm test:e2e` | Playwright smoke test against `pnpm preview` |
| `pnpm check` | `typecheck` + `lint` + `test:e2e` |
| `pnpm cf-typegen` | Regenerate `CloudflareEnv` from `wrangler.jsonc` |

## Environment & keys

Nothing in the baseline consumes secrets yet — this is preparation for the full
implementation prompt (Neon + Drizzle, Better Auth + Google, Gemini). Set them up
now so that phase is unblocked. See the **Pre-implementation readiness** checklist
in [AGENTS.md](./AGENTS.md).

### 1. Create your local env file

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` is gitignored — keep real values there only. Expected shape:

```
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.5-flash-lite"

E2E_TEST_MODE="false"
```

### 2. Where each value comes from

**`DATABASE_URL` — Neon Postgres**
1. Sign up at https://neon.tech and create a project (pick a region near you).
2. Dashboard → **Connection string** → copy the **pooled** string.
3. Form: `postgresql://user:pass@ep-xxx-pooler.<region>.aws.neon.tech/<db>?sslmode=require`.
4. Recommended: create a separate Neon **branch** (e.g. `test`) and use its connection
   string for e2e/CI so tests never touch dev data.

**`BETTER_AUTH_SECRET` — Better Auth**
- Generate a fresh 32-byte secret (don't reuse across environments):
  ```bash
  openssl rand -base64 32
  ```

**`BETTER_AUTH_URL`**
- Local: `http://localhost:3000`. Production: your deployed origin
  (e.g. `https://form-craft-ai.<subdomain>.workers.dev` or a custom domain).

**`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth**
1. https://console.cloud.google.com → create/select a project.
2. **APIs & Services → OAuth consent screen** → configure (External; add yourself as a test user).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
4. Under **Authorized redirect URIs**, add the Better Auth Google callback for each origin:
   - `http://localhost:3000/api/auth/callback/google`
   - `<your production origin>/api/auth/callback/google`
5. Copy the **Client ID** and **Client secret**.

   The `/api/auth/callback/google` path is Better Auth's default and is confirmed
   when auth is wired in the implementation phase.

**`GEMINI_API_KEY` — Google Gemini**
1. https://aistudio.google.com/apikey → **Create API key**.
2. Copy it. The model is selected via `GEMINI_MODEL` (`gemini-2.5-flash-lite`).

### 3. Production secrets (Cloudflare)

`.dev.vars` is local only. In production, set the same variables as encrypted
Worker secrets — never in the repo. Log in once, then run each command and paste
the value when prompted:

```bash
pnpm wrangler login
pnpm wrangler secret put DATABASE_URL
pnpm wrangler secret put BETTER_AUTH_SECRET
pnpm wrangler secret put BETTER_AUTH_URL
pnpm wrangler secret put GOOGLE_CLIENT_ID
pnpm wrangler secret put GOOGLE_CLIENT_SECRET
pnpm wrangler secret put GEMINI_API_KEY
pnpm wrangler secret put GEMINI_MODEL
pnpm wrangler secret put E2E_TEST_MODE
```

Never paste secrets into source files, commits, or chat. See AGENTS.md →
**Pre-implementation readiness**.

## Deploy (Cloudflare Workers)

Local dev needs no Cloudflare account — deploy only when you're ready to ship.
There's no API key to store and no Worker to pre-create: `wrangler login` is
interactive (browser OAuth) and `pnpm deploy` creates the Worker automatically.

1. **One-time** — a free [Cloudflare account](https://dash.cloudflare.com/sign-up),
   then authenticate wrangler (token stored locally in `~/.config/.wrangler`, never in the repo):
   ```bash
   pnpm wrangler login
   ```
2. **Deploy** — builds the OpenNext bundle and creates/updates the Worker
   (`name: "form-craft-ai"` from `wrangler.jsonc`):
   ```bash
   pnpm deploy   # = opennextjs-cloudflare build && opennextjs-cloudflare deploy
   ```
   The first deploy prints your URL, e.g. `https://form-craft-ai.<subdomain>.workers.dev`.
3. **Production secrets** — push the same values as your local `.dev.vars` (encrypted
   on the Worker, never committed). Use the `pnpm wrangler secret put …` list under
   [Production secrets](#3-production-secrets-cloudflare) above. Set these before
   deploying code that reads them (the baseline reads none, so it deploys without them).
4. **Point auth at the deployed origin** (when auth lands in the implementation phase):
   - Set production `BETTER_AUTH_URL` to the deployed URL — either
     `pnpm wrangler secret put BETTER_AUTH_URL`, or a non-secret `vars` entry in
     `wrangler.jsonc` (a URL isn't a secret).
   - Add `<deployed-origin>/api/auth/callback/google` to the Google OAuth
     **Authorized redirect URIs**.

Tip: verify the exact build that ships, locally first, with `pnpm preview` (same
workerd runtime). To roll back, redeploy a previous commit. CI/automated deploys
would use a `CLOUDFLARE_API_TOKEN` GitHub secret (not `.dev.vars`) — out of scope
until you set up CI.

## Conventions

See **[AGENTS.md](./AGENTS.md)** — especially the Cloudflare runtime rules
(no module-scope secrets; read env per-request via `lib/cf.ts` `getEnv()`).
