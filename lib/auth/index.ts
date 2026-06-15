import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

/**
 * Per-request Better Auth instance. Built inside the request from `getEnv()` —
 * never `export const auth = betterAuth(...)` at module scope (that captures env
 * at import time and crashes on Workers).
 */
export function createAuth(env: CloudflareEnv) {
	// Test mode enables the email/password path used ONLY by the guarded
	// /api/test/seed-session route (Playwright owner flows). It is off in
	// production (E2E_TEST_MODE unset / "false"), so production has no
	// email/password sign-up and the seed route 404s — fail closed.
	const isTestMode = env.E2E_TEST_MODE === "true";

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(getDb(env), { provider: "pg", schema }),
		// Email/password is a real Better Auth credential flow — it creates a real
		// user + session, so owner authorization is genuinely exercised, not bypassed.
		emailAndPassword: { enabled: isTestMode },
		// The preview server serves on :8787 while baseURL is :3000; allow the
		// preview origin so the seed POST isn't rejected as a cross-origin request.
		...(isTestMode
			? { trustedOrigins: ["http://localhost:8787", "http://localhost:3000"] }
			: {}),
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
		},
		// nextCookies() must be the LAST plugin so it can set cookies on responses.
		plugins: [nextCookies()],
	});
}

export type Auth = ReturnType<typeof createAuth>;
