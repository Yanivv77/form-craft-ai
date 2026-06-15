// Secret env vars provided via `.dev.vars` locally and `wrangler secret put` in
// production. `wrangler types` (pnpm cf-typegen) only emits bindings/vars from
// wrangler.jsonc, never `.dev.vars` secrets — so we declaration-merge them onto
// the generated `CloudflareEnv` here. Keep secrets out of wrangler.jsonc.
//
// This file has no imports/exports on purpose: it must stay a global ambient
// declaration so the interface merges with cloudflare-env.d.ts.

interface CloudflareEnv {
	DATABASE_URL: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GEMINI_API_KEY: string;
	GEMINI_MODEL: string;
	/** "true" enables the guarded e2e test-mode sign-in route. */
	E2E_TEST_MODE: string;
}
