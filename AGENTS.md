# AGENTS.md — form-craft-ai

Canonical guide for working in this repo. Keep it current. `CLAUDE.md` points here.

## What this is

The verified **baseline** for an AI form builder. No product features yet — the
database, auth, AI, and the builder are added by a separate implementation prompt
on top of this baseline. The goal of this repo is a clean foundation that **boots
under the real Cloudflare runtime** (`pnpm preview` / workerd), not just `next dev`.

## Pre-implementation readiness

Complete before starting the full implementation prompt. Secrets stay in `.dev.vars`
locally and as Cloudflare Worker secrets in production — never committed. See
README → "Environment & keys" for how to obtain each value.

- [ ] **Neon dev DB created** — project + pooled `DATABASE_URL`.
- [ ] **Neon test DB or branch planned** — a separate branch/DB for e2e/CI (no shared data with dev).
- [ ] **`.dev.vars` created locally** — `cp .dev.vars.example .dev.vars`, real values filled in, still untracked.
- [ ] **Google OAuth callback URLs configured** — `http://localhost:3000/api/auth/callback/google` + the production origin's callback added in Google Cloud Console.
- [ ] **Gemini key created** — `GEMINI_API_KEY` from AI Studio; `GEMINI_MODEL=gemini-2.5-flash-lite`.
- [ ] **Cloudflare secrets planned** — know the `pnpm wrangler secret put <NAME>` set to run for production (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GEMINI_API_KEY, GEMINI_MODEL, E2E_TEST_MODE).
- [ ] **No secrets committed** — `git status` clean; only `.dev.vars.example` (placeholders) is tracked; `git ls-files` shows no `.dev.vars` / `.env`.
- [ ] **`pnpm preview` passes** — boots under workerd.
- [ ] **`pnpm check` passes** — typecheck + lint + e2e green.

## Stack

- Next.js 16.2.6 (App Router, React 19, TypeScript, Turbopack)
- Cloudflare Workers via `@opennextjs/cloudflare` v1.19.x (`nodejs_compat`)
- pnpm (single lockfile), Node 24 (`.nvmrc`)
- Tailwind v4 (CSS-first) + shadcn/ui (Base UI, style `base-nova`)
- next-intl 4 (`app/[locale]`, `en` only for now)
- Biome 2 (lint + format), Playwright (e2e)

## Commands

| Command | Runs | Notes |
|---|---|---|
| `pnpm dev` | `next dev` | Local dev. Bindings work via `initOpenNextCloudflareForDev()` in `next.config.ts`. |
| `pnpm build` | `next build` | Fast correctness gate. Does **not** produce the Worker bundle. |
| `pnpm preview` | `opennextjs-cloudflare build && opennextjs-cloudflare preview` | Builds the OpenNext bundle and serves it on **workerd** (the real runtime) at http://localhost:8787. The boot gate. |
| `pnpm deploy` | `opennextjs-cloudflare build && opennextjs-cloudflare deploy` | Build + publish to Cloudflare. |
| `pnpm typecheck` | `tsc --noEmit` | |
| `pnpm lint` / `pnpm format` | `biome check .` / `biome check --write .` | |
| `pnpm cf-typegen` | `wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts` | Regenerates `cloudflare-env.d.ts`. Re-run after editing bindings in `wrangler.jsonc`. |
| `pnpm test:e2e` | `playwright test` | Boots `pnpm preview` (workerd) and runs the smoke test. |
| `pnpm test:e2e:install` | `playwright install --with-deps chromium` | One-time browser install. |
| `pnpm check` | `pnpm typecheck && pnpm lint && pnpm test:e2e` | Full gate. |

### Script mapping (vs. OpenNext/C3 defaults)

`preview`/`deploy` chain `opennextjs-cloudflare build` because those subcommands
don't build on their own — kept from the generated template. `build` stays plain
`next build` as a fast gate that does **not** produce the Worker bundle (use
`pnpm preview` for the real runtime). We replaced `next lint` with Biome and
removed the generated `upload` script. `cf-typegen` is unchanged.

## Cloudflare runtime rules (read before writing server code)

"Works in `next dev`" ≠ "works on Workers". Always verify under `pnpm preview`.

- **No secrets or bindings at module scope.** `env` is per-request. Read it via
  `lib/cf.ts` `getEnv()` (wraps `getCloudflareContext().env`) inside request
  handlers / Server Components / Route Handlers — never a module-level constant.
  Build per-request clients (DB, AI) inside the handler, not at import time.
- **IDs via Web Crypto** (`crypto.randomUUID()`), not Node `crypto` helpers.
- **Migrations are a deploy step**, never a module-load side effect.
- **`CloudflareEnv`** is generated from `wrangler.jsonc` by `pnpm cf-typegen`;
  add bindings there and re-run.

## Layout & intended layering

Root layout (no `src/`). `@/*` → repo root.

```
app/[locale]/{layout,page,not-found}.tsx  # locale layout owns <html lang>; home heading from messages/en.json
app/global-not-found.tsx                   # full <html> 404 for unmatched routes (experimental.globalNotFound)
app/globals.css                            # Tailwind v4 + shadcn tokens (stays at app/ root)
i18n/{routing,request,navigation}.ts       # single source of locales + locale-aware navigation
messages/en.json                           # translations
components/ui/                             # shadcn components
lib/cf.ts                                  # getEnv() — the only env accessor
lib/utils.ts                               # cn()
```

**No middleware.** There is intentionally no `proxy.ts`/`middleware.ts`. Next 16
forces the proxy onto the Node.js runtime, which @opennextjs/cloudflare cannot
build (`Node.js middleware is not currently supported` — workers-sdk#13755). The
`/` → `/en` entry redirect is a routes-manifest redirect in `next.config.ts`
(`redirects()`); the locale comes from the `[locale]` URL segment via
`setRequestLocale` (called in the layout and every page).

Planned (added by the implementation prompt): `lib/db` (Neon + Drizzle),
`lib/auth` (Better Auth), `lib/ai` (Gemini), `lib/forms` (the builder). Keep these
as thin, per-request factories.

### Adding a locale (e.g. `he`)

Add the code to `i18n/routing.ts` `locales` and create `messages/<locale>.json`;
routing and navigation derive from that list. Because there is no middleware,
also add the new locale's entry redirect (or rework the `/` redirect into
Accept-Language negotiation once @opennextjs/cloudflare supports Node proxy —
workers-sdk#13755). Hebrew + RTL + the theme toggle are deferred to the implementation prompt.

## Docs checked (2026-06-15)

- **OpenNext on Cloudflare** — https://opennext.js.org/cloudflare (get-started, cli, bindings) · https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ — Scaffold via C3; `wrangler.jsonc` with `nodejs_compat` + `compatibility_date: 2025-09-23`; per-request env via `getCloudflareContext().env`; `initOpenNextCloudflareForDev()` in `next.config.ts` for dev bindings.
- **next-intl 4** — https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing · https://next-intl.dev/docs/routing/middleware — `app/[locale]` routing with `defineRouting`/`getRequestConfig`/`createNavigation`; `params` is a Promise (await it). **Middleware dropped** — Next 16's `proxy.ts` is Node-runtime-only and unbuildable by @opennextjs/cloudflare (workers-sdk#13755); locale comes from the URL segment + `setRequestLocale`, and `/` is redirected via `next.config.ts`.
- **Next.js 16** — https://nextjs.org/docs/app/guides/upgrading/version-16 — `experimental.globalNotFound` + `app/global-not-found.tsx`; the `[locale]` layout owns `<html>` (no root `app/layout.tsx`).
- **shadcn/ui on Tailwind v4** — https://ui.shadcn.com/docs/installation/next · /docs/tailwind-v4 — `shadcn init -d` (style `base-nova`, base color neutral, CSS variables); `components.json` `tailwind.config: ""`, `css: app/globals.css`. No theme toggle yet.
- **Tailwind v4** — https://tailwindcss.com/docs — CSS-first: `@import "tailwindcss"`, `@tailwindcss/postcss`, no `tailwind.config.js`.
- **Biome 2** — https://biomejs.dev — `biome.json`; `biome check .`. ESLint removed.
- **Playwright** — https://nextjs.org/docs/app/guides/testing/playwright — `webServer` boots `pnpm preview`; smoke test asserts `/` → `/en` and the `/en` heading.

## Decisions & assumptions

(Append new entries as later layers are built.)

- **2026-06-15** — **Middleware dropped (version trap, workers-sdk#13755).** Next 16's `proxy.ts`/middleware runs only on the Node.js runtime, which @opennextjs/cloudflare v1.19.x cannot build (`Node.js middleware is not currently supported`), and OpenNext doesn't support the edge runtime either. Rather than downgrade off Next 16 (a hard requirement), the `/` → `/en` redirect is done via `next.config.ts` `redirects()` and locale resolution relies on the `[locale]` segment + `setRequestLocale`. Revisit (restore next-intl middleware for Accept-Language negotiation) once OpenNext supports Node proxy.
- **2026-06-15** — `compatibility_date` pinned to `2025-09-23` (≥ OpenNext's 2024-09-23 minimum, not in the future for the installed workerd). The build prints a benign "consider a more recent date" hint.
- **2026-06-15** — ESLint removed in favor of Biome (single linter/formatter); the OpenNext template re-adds ESLint, so it was removed manually. `public/**` excluded from Biome; `tailwindDirectives` enabled in the CSS parser so `@theme`/`@apply` parse.
- **2026-06-15** — `src/` flattened to repo root; `@/*` → `./*` to match the layering the implementation prompt expects.
- **2026-06-15** — Native build scripts in `pnpm-workspace.yaml`: `esbuild`/`workerd`/`sharp`/`unrs-resolver` approved; `@parcel/watcher`/`@swc/core` set to `false` (prebuilt binaries used).
- **2026-06-15** — Playwright `--with-deps` skipped during setup (needs sudo on WSL); Chromium launches with the OS libraries already present. Run `pnpm test:e2e:install` on a fresh machine.
- **2026-06-15** — **Better Auth + Drizzle + Neon on Workers (guidance for the implementation phase).** Supported combo via Better Auth's `drizzleAdapter`. Two runtime constraints to honor when wiring it up: (1) **Driver** — use Neon's serverless driver (`@neondatabase/serverless` + `drizzle-orm/neon-http`) over the **pooled** `DATABASE_URL`, never node `pg` (workerd has no raw TCP). If a flow needs a real multi-statement transaction, use the Neon serverless **WebSocket** driver for that path (`neon-http` is one round-trip per query). (2) **Per-request** — build the Drizzle client and the Better Auth instance inside the request via `getEnv()` (`lib/cf.ts`), never at module scope. Schema (`user`/`session`/`account`/`verification`) is generated with `@better-auth/cli generate` and migrated onto Neon with Drizzle.
