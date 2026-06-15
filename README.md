# Form Craft AI

Type an idea, let AI draft the form, edit it, then share a link and collect
responses. Everything up to Save is anonymous and runs in your browser, so the
form lives in local state until you save it. You sign in only at Save, and the
people who fill out your forms stay anonymous.

Live: https://form-craft-ai.yanivv77.workers.dev

![Form Craft AI home page](docs/home.png)

## What it does

- Describe a form in plain language and get editable questions back from Gemini.
- Edit titles, questions, and field types, and preview before you save.
- Save with Google sign-in, get a public link, and collect responses.
- Export responses to CSV.
- Works in English and Hebrew (right to left).

The homepage is the builder. There is no separate marketing page. For the
architecture, the Cloudflare runtime rules, and the per-layer decisions log, see
[AGENTS.md](./AGENTS.md).

## Stack

Next.js 16 (App Router) on Cloudflare Workers via OpenNext. Neon Postgres with
Drizzle (`neon-http`). Better Auth with Google. Gemini Flash-Lite. Tailwind v4
with shadcn/ui. next-intl for English and Hebrew. Biome for lint and format,
Playwright for end-to-end tests.

## Quick start

You need Node 24 (see `.nvmrc`) and pnpm 11 (`corepack enable`).

```bash
pnpm install
pnpm test:e2e:install      # one-time: Playwright Chromium (system deps need sudo)
cp .dev.vars.example .dev.vars   # then fill in the values (see "Environment and keys")
pnpm dev                   # http://localhost:3000
```

Before shipping, check the build on the real runtime with `pnpm preview` (workerd
on http://localhost:8787), not just `next dev`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server at http://localhost:3000 |
| `pnpm build` | `next build`, a fast gate that does not produce the Worker bundle |
| `pnpm preview` | Build and serve on Cloudflare workerd at http://localhost:8787 (the real runtime) |
| `pnpm deploy` | Build and deploy to Cloudflare |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | Types, Biome check, Biome write |
| `pnpm db:generate` / `pnpm db:migrate` | Generate Drizzle SQL, then apply migrations (both wrap `drizzle-kit` with `.dev.vars`) |
| `pnpm auth:generate` | Regenerate the Better Auth Drizzle schema (`lib/db/auth-schema.ts`) |
| `pnpm test:e2e` | Playwright suite against `pnpm preview` (uses the `.dev.vars` DB) |
| `pnpm test:e2e:isolated` | Same suite against a fresh throwaway Postgres DB (provision, migrate, run, clean up) |
| `pnpm check` | `typecheck` plus `lint` plus `test:e2e:isolated` |
| `pnpm cf-typegen` | Regenerate `CloudflareEnv` bindings from `wrangler.jsonc` |

Config lives in `wrangler.jsonc` (Worker and bindings), `open-next.config.ts`
(OpenNext), `drizzle.config.ts` (migrations), and `next.config.ts` (next-intl and
the cookie-aware `/` redirect). Secret env types are declaration-merged onto
`CloudflareEnv` in `env.d.ts`.

## Environment and keys

The app reads every secret per request through `getEnv()` in `lib/cf.ts`, never at
module scope (module-scope reads crash on Workers). You need a Neon database, a
Better Auth secret, Google OAuth credentials, and a Gemini API key.

Copy the example file and fill it in. `.dev.vars` is gitignored, so real values
live there only:

```bash
cp .dev.vars.example .dev.vars
```

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

Where each value comes from:

`DATABASE_URL` (Neon Postgres). Create a project at https://neon.tech, copy the
pooled connection string from the dashboard, and apply the schema with
`pnpm db:migrate`. For tests, `pnpm test:e2e:isolated` provisions a throwaway
[claimable-postgres](https://neon.new) database per run, so tests never touch your
dev data.

`BETTER_AUTH_SECRET` (Better Auth). Generate a fresh 32-byte secret per
environment with `openssl rand -base64 32`.

`BETTER_AUTH_URL`. Use `http://localhost:3000` locally. In production, use the
deployed origin, for example `https://form-craft-ai.<subdomain>.workers.dev`.

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (Google OAuth). In the Google Cloud
Console, create an OAuth client (Web application). Under Authorized redirect URIs,
add the Better Auth callback for each origin you use:

- `http://localhost:3000/api/auth/callback/google`
- `<your production origin>/api/auth/callback/google`

`GEMINI_API_KEY` (Google Gemini). Create a key at
https://aistudio.google.com/apikey. The model is set by `GEMINI_MODEL`
(`gemini-2.5-flash-lite`).

## Database migrations

The schema is in `lib/db/schema.ts` (Better Auth tables are generated into
`lib/db/auth-schema.ts`). Migrations run at deploy time, never during a request.

```bash
pnpm db:generate   # write SQL to ./drizzle after editing the schema
pnpm db:migrate    # apply pending migrations to DATABASE_URL (from .dev.vars)
```

In production, run `pnpm db:migrate` against the production `DATABASE_URL` as part
of the deploy.

## Deploy to Cloudflare Workers

Local development needs no Cloudflare account. `wrangler login` is an interactive
browser sign-in, and `pnpm deploy` creates the Worker on first run.

1. Sign in once (the token is stored in `~/.config/.wrangler`, never in the repo):

   ```bash
   pnpm wrangler login
   ```

2. Deploy. This builds the OpenNext bundle and creates or updates the Worker named
   `form-craft-ai` (from `wrangler.jsonc`):

   ```bash
   pnpm deploy
   ```

   The first deploy prints the URL, for example
   `https://form-craft-ai.<subdomain>.workers.dev`.

3. Set the production secrets as encrypted Worker secrets (the same values as your
   local `.dev.vars`, never committed). Keep `E2E_TEST_MODE` set to `false` in
   production so the test-only routes stay disabled:

   ```bash
   pnpm wrangler secret put DATABASE_URL
   pnpm wrangler secret put BETTER_AUTH_SECRET
   pnpm wrangler secret put BETTER_AUTH_URL
   pnpm wrangler secret put GOOGLE_CLIENT_ID
   pnpm wrangler secret put GOOGLE_CLIENT_SECRET
   pnpm wrangler secret put GEMINI_API_KEY
   pnpm wrangler secret put GEMINI_MODEL
   pnpm wrangler secret put E2E_TEST_MODE
   ```

4. Point auth at the deployed origin. Set `BETTER_AUTH_URL` to the deployed URL,
   and add `<deployed-origin>/api/auth/callback/google` to the Google OAuth
   Authorized redirect URIs.

If the deployed URL redirects to a Cloudflare Access login, your account has Zero
Trust protecting the `workers.dev` host. Remove the matching app under Zero Trust,
Access, Applications to make the site public.

To regenerate the screenshot above, run `node scripts/screenshot.mjs` (it points
at the live site by default; set `SHOT_URL` to capture a local preview).

## Abuse and cost protection

`/api/generate` is anonymous and costs money, so it is guarded from the start
(`lib/ai/guards.ts`, backed by Postgres). Each request caps the prompt at about
800 characters and the form at 12 fields and 8 options. An identical idea is
served from cache with no Gemini call. Anonymous users get about 3 generations per
day per IP, signed-in users about 20. A daily budget brake returns `429` past
about 500 calls per day, and past the anonymous limit the builder prompts sign-in.
For edge defense in depth, add Cloudflare WAF rate-limiting on
`POST /api/generate` and `POST /api/forms/*/responses`, plus Turnstile. See
AGENTS.md.

## Testing

`pnpm test:e2e:isolated` is the canonical run. It provisions a disposable Postgres
database, applies migrations, and runs the Playwright suite under `pnpm preview`
on real workerd. The suite mocks `/api/generate` and signs in through a guarded
test-only route that `E2E_TEST_MODE` enables, injected by the test runner with
wrangler `--var`. `.dev.vars` keeps the flag `"false"`, so the route returns 404
in production. Real Google OAuth is never used in tests.

## Conventions

See [AGENTS.md](./AGENTS.md), especially the Cloudflare runtime rules: no
module-scope secrets, and read env per request through `getEnv()` in `lib/cf.ts`.
