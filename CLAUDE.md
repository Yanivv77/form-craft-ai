# CLAUDE.md

See **[AGENTS.md](./AGENTS.md)** for the canonical guide — stack, commands, the
Cloudflare runtime rules (no module-scope secrets; per-request `getEnv()`),
layering, and the decisions log.

Always verify changes under `pnpm preview` (workerd), not only `next dev`.

## Writing quality

When writing or editing prose — docs, README/MD files, UI copy, user-facing
strings, comments, commit messages, and PR text — apply the **`avoid-ai-writing`**
skill to strip AI-isms (inflated phrasing, rule-of-three, em-dash overuse,
hedging, promotional tone). Prefer plain, direct language. (Full ruleset lives in
the skill; this is just the always-on reminder to use it.)
