import { defineConfig, devices } from "@playwright/test";

// The smoke test runs against `pnpm preview`, i.e. the OpenNext build served on
// workerd (the real Cloudflare runtime) — not `next dev`. wrangler dev defaults
// to port 8787. To run against the dev server instead, set command to "pnpm dev"
// and PORT to 3000.
const PORT = Number(process.env.PORT ?? 8787);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		// Builds + serves the OpenNext bundle on workerd, injecting E2E_TEST_MODE
		// (and an isolated DATABASE_URL when .test-db-url exists) via wrangler --var.
		command: "node scripts/preview-e2e.mjs",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 240 * 1000,
	},
});
