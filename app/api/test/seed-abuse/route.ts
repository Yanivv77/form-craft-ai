import { getClientIp, normalizeHash } from "@/lib/ai/guards";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { generationCache, usage } from "@/lib/db/schema";
import type { FormDef } from "@/lib/forms/types";

// Guarded test seeder: pre-populate usage counters / the prompt cache so the
// abuse e2e is deterministic and never calls Gemini. 404s outside test mode.
export async function POST(request: Request): Promise<Response> {
	const env = getEnv();
	if (env.E2E_TEST_MODE !== "true") {
		return new Response("Not found", { status: 404 });
	}

	const db = getDb(env);
	const day = new Date().toISOString().slice(0, 10);
	const ip = getClientIp(request);
	const body = (await request.json().catch(() => ({}))) as {
		usage?: { scope: string; key?: string; count: number }[];
		cache?: { prompt: string; formDef: FormDef; locale?: string };
	};

	for (const u of body.usage ?? []) {
		// For per-IP entries, key on the request's own IP so the generate call
		// (same client) resolves to the same key regardless of header handling.
		const key = u.scope === "ip" ? ip : (u.key ?? "all");
		await db
			.insert(usage)
			.values({ day, scope: u.scope, key, count: u.count })
			.onConflictDoUpdate({
				target: [usage.day, usage.scope, usage.key],
				set: { count: u.count },
			});
	}

	if (body.cache?.prompt) {
		const hash = await normalizeHash(body.cache.prompt);
		const locale = body.cache.locale ?? "en";
		await db
			.insert(generationCache)
			.values({ promptHash: hash, formDef: body.cache.formDef, locale })
			.onConflictDoUpdate({
				target: generationCache.promptHash,
				set: { formDef: body.cache.formDef, locale },
			});
	}

	return Response.json({ ok: true, ip });
}

export async function GET(): Promise<Response> {
	if (getEnv().E2E_TEST_MODE !== "true") {
		return new Response("Not found", { status: 404 });
	}
	return new Response("Use POST to seed abuse counters", { status: 405 });
}
