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

### Layer 1 — Foundation (DB + Auth), built 2026-06-15

- **`neon-http` is fine for Better Auth — no WebSocket driver needed.** The Drizzle adapter does not implement a real `transaction`, so Better Auth auto-patches it to run the callback inline (no `BEGIN/COMMIT`); every operation is an individual statement, exactly what `neon-http` supports. It logs a one-time "Adapter does not correctly implement transaction function, patching it automatically" warning — benign. Trade-off: sign-up/OAuth writes (insert user + account + session) are not atomic; acceptable for this MVP. Revisit with `neon-serverless` (WebSocket Pool) only if atomicity becomes a requirement. Verified under `preview`: `POST /api/auth/sign-in/social` (google) returns a real Google OAuth URL and persists PKCE state to `verification` via `neon-http`.
- **Secret env types are declaration-merged in `env.d.ts`.** `wrangler types` (`pnpm cf-typegen`) only emits bindings/`vars` from `wrangler.jsonc`, never `.dev.vars` secrets. `env.d.ts` (a tracked global ambient `.d.ts`, no imports/exports) merges `DATABASE_URL`/`BETTER_AUTH_*`/`GOOGLE_*`/`GEMINI_*`/`E2E_TEST_MODE` onto `CloudflareEnv`. Secrets stay out of `wrangler.jsonc` (`wrangler secret put` in prod).
- **Auth route is request-scoped, not `toNextJsHandler`.** `app/api/auth/[...all]/route.ts` exports `GET`/`POST` that call `createAuth(getEnv()).handler(req)`. `toNextJsHandler` needs a module-level `auth` instance, which would capture env at import and break the no-module-scope rule. A CLI-only `lib/auth/cli.ts` (reads `process.env`, never imported by runtime code) satisfies `@better-auth/cli generate`'s config discovery.
- **`BETTER_AUTH_URL` stays `http://localhost:3000`.** Generated OAuth `redirect_uri` therefore points at `:3000`, where the Google console callback is registered — so the real Google round-trip is verified under `pnpm dev`. workerd runtime correctness (per-request factory, DB read/write) is verified under `preview` via the probes above and, from Layer 2, the guarded `E2E_TEST_MODE` seeded session (no real OAuth in Playwright).
- **`@better-auth/cli@latest` resolved to 1.4.x while core is 1.6.18.** The CLI is versioned separately; the generated core tables (`user`/`session`/`account`/`verification`) are stable across these versions and load cleanly under 1.6.18. Re-run `pnpm auth:generate` if Better Auth is upgraded.
- **Scripts:** `db:generate`/`db:migrate`/`db:push`/`db:studio` wrap `drizzle-kit` in `dotenv -e .dev.vars --` so it sees `DATABASE_URL`; `auth:generate` regenerates `lib/db/auth-schema.ts`.

### Layer 2 — Walking skeleton, built 2026-06-15

- **Pages that read per-request env must be `export const dynamic = "force-dynamic"`.** The `[locale]` layout's `generateStaticParams` makes child pages with no other params (e.g. `/[locale]/forms`) eligible for static prerender; at build time there is no Cloudflare request context, so `getEnv()`/`getCloudflareContext()` throws `make sure the route is not static`. The dashboard, owner page, and public form page are forced dynamic. The home page stays SSG (messages only, no env).
- **Seeded test sign-in is a REAL credential session, not a bypass.** `/api/test/seed-session` (POST) calls Better Auth's `signUpEmail`/`signInEmail` (`asResponse: true`) to create a real user + session and set the real cookie. Owner authorization is therefore genuinely exercised (cross-user access returns 404, verified). `emailAndPassword` is enabled **only** when `E2E_TEST_MODE === "true"`; in production it is disabled and the route 404s — **fail-closed verified** by re-serving the built bundle with the flag off (POST + GET both 404, while `/api/whoami` still 401s).
- **`trustedOrigins` includes `http://localhost:8787` in test mode.** The preview server runs on `:8787` while `baseURL` is `:3000`; without this, Better Auth rejects the seed POST as a cross-origin request. Added only when `E2E_TEST_MODE === "true"`.
- **`.dev.vars` `E2E_TEST_MODE="true"` locally** so the Playwright suite (which boots `pnpm preview`) has the seed route. Production sets the secret to `"false"`/unset. Playwright's `page.request.post` shares the browser-context cookie jar, so seeding once authenticates subsequent `page.goto` navigations.
- **Ownership lives in the query** (`getOwnedForm` filters `ownerId` in the WHERE clause). Non-owner / anonymous access to `/[locale]/forms/[id]` returns `notFound()` (404) rather than 403, to avoid leaking form existence. Public submission (`POST /api/forms/[id]/responses`) is anonymous by design.

### Layer 3 — AI generation, built 2026-06-15

- **One chokepoint: `lib/ai/generate.ts` → `generateForm(env, prompt)`.** Exactly one `fetch` to `…/v1beta/models/${GEMINI_MODEL}:generateContent` with `x-goog-api-key`. `app/api/generate/route.ts` is a thin wrapper; Layer 7 attaches quotas/cache/budget-brake in front of `generateForm` without restructuring.
- **`thinkingConfig: { thinkingBudget: 0 }` IS accepted by `gemini-2.5-flash-lite`** — verified with a real call (HTTP 200, valid structured form). It is still sent best-effort; the result handling does not depend on it.
- **Structured output uses the flat shape:** `generationConfig.responseMimeType: "application/json"` + `responseSchema` (a pruned OpenAPI subset in `lib/ai/prompt.ts`, hand-maintained beside the Zod schema — NOT `zod-to-json-schema`). `temperature: 0.2`, `maxOutputTokens: 2048`.
- **Intrinsic caps (cheap, in `generateForm`):** prompt ≤ 800 chars (friendly 400 otherwise), ≤ 12 fields, ≤ 8 options/field (clamped in `normalize`), one call. The model returns no ids — `normalize` assigns Web-Crypto ids; answers are keyed by id.
- **Degrade gracefully:** `parseJsonLoose` does ONE cleanup pass (strip ```fences / slice `{…}`), never a second model call; on failure (or Zod failure, or zero fields) the route returns a friendly message and never leaks upstream error detail. Untrusted output → `normalizeFormDef` (type synonyms, demote choice-without-options to text) → `formDefSchema.safeParse`.
- **Detected content locale** (`detectLocale`, primary subtag, default `en`) is returned alongside the form and stored in `forms.locale` at save — it drives the public page's LTR/RTL in Layer 6.
- **Deterministic tests run inside Playwright without a browser.** Playwright resolves the tsconfig `@/*` path alias, so `tests/e2e/generate.spec.ts` imports `normalize`/`schema`/`generate` helpers directly for pure-logic assertions. The prompt-cap cases hit the real route but return before any Gemini call (no cost). The live Gemini call stays a manual/preview check, out of the default suite.

### Layer 4 — Rich builder, built 2026-06-15

- **The homepage IS the builder** (`app/[locale]/page.tsx` renders the `<Builder>` client island). No marketing page. The page stays SSG (no env); the builder runs client-side and hits `/api/generate` + Server Actions. The Layer 2 `createBlankForm` action was removed (superseded).
- **Anonymous-until-save.** The draft lives in versioned `localStorage` (`formcraft.draft.v1`). Save: if signed in → `saveForm` Server Action → redirect to the owner page; if anonymous → stash to `formcraft.pendingSave.v1`, run `authClient.signIn.social({ callbackURL: "/<locale>?save=1" })`, and on return the builder consumes the stash + session and auto-completes the save. The e2e simulates the sign-in return (seed session + stash + `?save=1`) since real Google OAuth can't run in Playwright — the autocomplete logic itself is genuinely exercised.
- **Native styled controls, not base-ui Select/RadioGroup.** The field editor and the shared `FieldControl` (used by both the live preview and the public form) use native HTML inputs styled with design tokens. This is the simpler Cloudflare-safe path and keeps preview == public render from one component; base-ui's `Select` (`items` prop, render props) added complexity without user-facing benefit for the MVP. Revisit during the Layer 6 polish pass if richer controls are wanted. The shadcn `Button` is still used for all actions.
- **Soft-delete is server-enforced by context.** In the editor, removing a field on an EXISTING form sets `hidden: true` (so response ids stay resolvable); on a NEW form it drops the field. `saveForm` (new) filters hidden out; `updateForm` (existing) keeps them. Reorder keeps hidden fields at the end.
- **Server-side sanitize on every write.** `saveForm`/`updateForm` run untrusted client input through `formDefSchema.safeParse` + unique-id enforcement before persisting; `updateForm` re-checks ownership via `getOwnedForm` (ownerId in the WHERE). `deleteForm` is a `FormData` action (ownerId in the WHERE; responses cascade).
- **Logical Tailwind utilities throughout** (`ms-/me-/text-start`, etc.) so Layer 6 RTL is a token/`dir` change, not a rewrite. A session-aware `Header` (sign in/out via `authClient`) lives in the `[locale]` layout.

### Layer 5 — Responses hardening + CSV, built 2026-06-15

- **`validateSubmission` is now the full server-side gate** (same function L2 stubbed): required, per-type (`email`/`url`/`number`/`date`), option membership for choice fields, array-vs-scalar shape, and rejection of unknown field ids (→ submission-level `_form` error). Hidden fields are not required/re-validated. Returns field-keyed 422 errors. `url` requires an `http(s)` scheme.
- **`lib/forms/export.ts` is the single source for table + CSV columns.** `buildColumns` = union of visible fields (in order) + hidden fields that have answers (labeled "… (removed)") + orphan answer ids (labeled by id) — so answers to removed/deleted fields stay visible. The owner table and the CSV both use it, so they never drift.
- **CSV: BOM + formula-injection guard + CRLF.** `toCsv` prepends a UTF-8 BOM (`﻿`, Hebrew/Excel-safe), joins array answers with ", ", and `escapeCsvCell` neutralises spreadsheet formula injection by prefixing `'` to any cell starting with `= + - @` (or tab/CR) and quoting it. Verified: a `=cmd()` cell exports as `"'=cmd()"`.
- **Export route is owner-only:** `GET /api/forms/[id]/export` returns 401 (anonymous), 404 (non-owner / missing, via `getOwnedForm`), and a `text/csv; charset=utf-8` attachment for the owner.

### Layer 6 — Theme + i18n (EN/HE, RTL), built 2026-06-15

- **next-themes** wraps the app in `[locale]/layout.tsx` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`), with `suppressHydrationWarning` on `<html>`. The existing `@custom-variant dark (&:is(.dark *))` + `.dark { … }` tokens in `globals.css` are already next-themes-compatible (class on `<html>`).
- **`he` locale + RTL.** `i18n/routing.ts` → `locales: ["en","he"]` + `localeDirection()`; `<html lang dir>` per locale; base-ui `DirectionProvider` wraps the tree. Every UI string is externalised into `messages/en.json` + `messages/he.json` (the English values match the e2e selectors, so existing tests stay green).
- **No middleware ⇒ cookie-aware entry only, no Accept-Language.** The bare `/` redirect uses `next.config` `redirects()` with a `has` cookie rule (`NEXT_LOCALE=he → /he`, else `/en`). `i18n/request.ts` is segment-first with a `NEXT_LOCALE` cookie fallback. The `LanguageSwitcher` writes that cookie and soft-navigates via the next-intl router — a soft locale switch correctly updates `<html lang/dir>` (verified).
- **Public form renders in the FORM's stored locale, not the viewer's.** `/[locale]/f/[id]` sets `<main dir>` from `form.locale` and wraps `PublicForm` in a nested `NextIntlClientProvider` with that locale's messages, so a shared Hebrew form is RTL + Hebrew for an English-UI viewer.
- **Known minor gaps (documented, not blocking):** server-side validation messages and the CSV "(removed)" column suffix stay English (the server has no UI-locale context); Hebrew uses the browser's system fallback font (no dedicated Hebrew webfont yet). Both are future polish.

### Layer 7 — Hardening + abuse guards + full suite, built 2026-06-15

- **Abuse protection is Postgres-backed** (chosen over KV: no new binding, single-statement upserts on neon-http, fully verifiable under preview). `usage(day, scope, key, count)` (composite PK) + `generation_cache(prompt_hash, …)`. `lib/ai/guards.ts` runs in front of the single Gemini call in `app/api/generate/route.ts`: normalize→SHA-256 **cache** (identical idea → no call) → daily **budget brake** (≥ 500 calls/day → 429) → per-**user** (20/day) / per-**IP** (3/day, anonymous) quota. Blocked requests don't increment counters (read-then-`recordCall`-after-the-call). Anonymous-limit 429s carry `signInPrompt: true`; the builder shows a Sign-in button.
- **Isolated, disposable test DB (claimable-postgres).** `pnpm test:e2e:isolated` (and `pnpm check`) provisions a throwaway neon.new DB (`scripts/setup-test-db.mjs`, 72h TTL), migrates it, runs the suite, then removes `.test-db-url`. The Playwright webServer is `scripts/preview-e2e.mjs`, which injects `E2E_TEST_MODE:true` (and `DATABASE_URL:<isolated>` when `.test-db-url` exists) via wrangler `--var` — so **`.dev.vars` `E2E_TEST_MODE` stays `"false"`** (production-safe) and tests never touch the dev DB. Plain `pnpm test:e2e` still runs against `.dev.vars` for fast local iteration. (`--var` overriding `.dev.vars` is verified.)
- **Deterministic abuse e2e, zero Gemini calls.** `tests/e2e/abuse.spec.ts` is serial (shared per-day counters) and uses a guarded `/api/test/seed-abuse` route to pre-set counters / cache; every abuse case is blocked or cache-served before any Gemini call. Per-IP seeding keys on the request's own IP so the seed and the generate call (same client) resolve to the same key regardless of header handling.
- **Edge rate-limiting + Turnstile = documented defense-in-depth (not code-wired).** The app-level Postgres caps above are the verified production backstop. The recommended additional edge layer (needs Cloudflare config / keys, so it is intentionally not wired into the verified flow):
  - **Cloudflare WAF Rate Limiting rules** (dashboard, zero code) on `POST /api/generate` (≈ 5 req / 10 min / IP → managed challenge) and `POST /api/forms/*/responses`. Alternatively the Workers rate-limiting binding once it suits.
  - **Progressive Turnstile**: issue a Turnstile site key, render the widget after the first 1–2 anonymous generations, and verify the token server-side in `app/api/generate/route.ts` before `preGuard` (gated on a `TURNSTILE_SECRET` env var so it's a no-op until configured). Left out of the build to avoid adding an unverifiable external dependency to the green flow.
- **Full coverage matrix green** under `pnpm preview` (35 tests): home=builder, generate→edit, edit fields, save→share, public submit→thank-you, response in owner view, CSV `=`-cell quoted, cross-user authz blocked, required blocks submit, theme toggle, Hebrew RTL+translated, anonymous-limit→sign-in prompt + over-long prompt rejected. `pnpm check` = typecheck + lint + isolated suite.
