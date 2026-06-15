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

## Environment

Copy `.dev.vars.example` → `.dev.vars` for local secrets (gitignored). Nothing
consumes them yet — they document what the implementation prompt will need.

## Conventions

See **[AGENTS.md](./AGENTS.md)** — especially the Cloudflare runtime rules
(no module-scope secrets; read env per-request via `lib/cf.ts` `getEnv()`).
