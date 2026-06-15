import { createAuth } from "@/lib/auth";
import { getEnv } from "@/lib/cf";

/**
 * Guarded test-only sign-in. Creates a REAL Better Auth user + session and sets
 * the REAL session cookie via the credential flow — it does NOT bypass owner
 * checks (the seeded user owns only what it creates). Used by Playwright instead
 * of real Google OAuth.
 *
 * Fails closed: when E2E_TEST_MODE !== "true" the route 404s and the underlying
 * email/password endpoints are disabled (see createAuth), so it does not exist
 * in production.
 */
function guard(env: CloudflareEnv): Response | null {
	if (env.E2E_TEST_MODE !== "true") {
		return new Response("Not found", { status: 404 });
	}
	return null;
}

export async function POST(request: Request): Promise<Response> {
	const env = getEnv();
	const blocked = guard(env);
	if (blocked) return blocked;

	const auth = createAuth(env);
	const body = (await request.json().catch(() => ({}))) as {
		email?: string;
		name?: string;
	};
	const email = body.email ?? "owner@example.com";
	const name = body.name ?? "Test Owner";
	const password = "seed-password-12345";

	// Sign up if new; if the user already exists, fall back to sign-in. Both
	// return a real session cookie via asResponse.
	const signUp = await auth.api.signUpEmail({
		body: { email, password, name },
		asResponse: true,
	});
	if (signUp.ok) return signUp;

	return auth.api.signInEmail({
		body: { email, password },
		asResponse: true,
	});
}

export async function GET(): Promise<Response> {
	const blocked = guard(getEnv());
	if (blocked) return blocked;
	return new Response("Use POST to seed a session", { status: 405 });
}
