# CLAUDE.md

See **[AGENTS.md](./AGENTS.md)** for the canonical guide — stack, commands, the
Cloudflare runtime rules (no module-scope secrets; per-request `getEnv()`),
layering, and the decisions log.

Always verify changes under `pnpm preview` (workerd), not only `next dev`.
