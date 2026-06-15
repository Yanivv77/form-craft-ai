import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { generationCache, usage } from "@/lib/db/schema";
import type { FormDef } from "@/lib/forms/types";

// v1 policy. Anonymous gets a small free allowance, logged-in users more, and an
// app-owned daily budget is the cost backstop independent of Gemini's quota.
export const LIMITS = {
	ANON_PER_DAY: 3,
	USER_PER_DAY: 20,
	DAILY_BUDGET: 500,
} as const;

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

/** Per-request client IP. cf-connecting-ip is set by Cloudflare in production. */
export function getClientIp(req: Request): string {
	return (
		req.headers.get("cf-connecting-ip") ||
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		"anon"
	);
}

/** Normalize (lowercase → trim → collapse spaces) then SHA-256 (Web Crypto). */
export async function normalizeHash(prompt: string): Promise<string> {
	const normalized = prompt.toLowerCase().trim().replace(/\s+/g, " ");
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(normalized),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

type Db = ReturnType<typeof getDb>;

async function getCount(db: Db, scope: string, key: string): Promise<number> {
	const rows = await db
		.select({ count: usage.count })
		.from(usage)
		.where(
			and(eq(usage.day, today()), eq(usage.scope, scope), eq(usage.key, key)),
		)
		.limit(1);
	return rows[0]?.count ?? 0;
}

async function bump(db: Db, scope: string, key: string): Promise<void> {
	await db
		.insert(usage)
		.values({ day: today(), scope, key, count: 1 })
		.onConflictDoUpdate({
			target: [usage.day, usage.scope, usage.key],
			set: { count: sql`${usage.count} + 1` },
		});
}

export type GuardDecision =
	| { kind: "cache"; form: FormDef; locale: string }
	| { kind: "blocked"; status: 429; message: string; signInPrompt: boolean }
	| { kind: "allow"; hash: string };

/**
 * Run before the single Gemini call: cache short-circuit, the daily budget
 * brake, then per-user / per-IP quotas. Reads only — `recordCall` does the
 * increment after a real call so blocked requests never inflate the counters.
 */
export async function preGuard(
	env: CloudflareEnv,
	{ prompt, ip, userId }: { prompt: string; ip: string; userId?: string },
): Promise<GuardDecision> {
	const db = getDb(env);
	const hash = await normalizeHash(prompt);

	// 1. Identical idea → return the cached form with no Gemini call.
	const cached = await db
		.select()
		.from(generationCache)
		.where(eq(generationCache.promptHash, hash))
		.limit(1);
	if (cached[0]) {
		return { kind: "cache", form: cached[0].formDef, locale: cached[0].locale };
	}

	// 2. Emergency daily budget brake (cost backstop).
	if ((await getCount(db, "global", "all")) >= LIMITS.DAILY_BUDGET) {
		return {
			kind: "blocked",
			status: 429,
			message: "Daily AI limit reached. Please try again tomorrow.",
			signInPrompt: false,
		};
	}

	// 3. Per-user / per-IP quota.
	if (userId) {
		if ((await getCount(db, "user", userId)) >= LIMITS.USER_PER_DAY) {
			return {
				kind: "blocked",
				status: 429,
				message:
					"You've reached today's generation limit. Please try again tomorrow.",
				signInPrompt: false,
			};
		}
	} else if ((await getCount(db, "ip", ip)) >= LIMITS.ANON_PER_DAY) {
		return {
			kind: "blocked",
			status: 429,
			message: "You've hit the free generation limit. Sign in to keep going.",
			signInPrompt: true,
		};
	}

	return { kind: "allow", hash };
}

/** Count a real Gemini call against the global budget + the per-user/IP quota. */
export async function recordCall(
	env: CloudflareEnv,
	{ ip, userId }: { ip: string; userId?: string },
): Promise<void> {
	const db = getDb(env);
	await bump(db, "global", "all");
	if (userId) await bump(db, "user", userId);
	else await bump(db, "ip", ip);
}

/** Cache a successful result so an identical idea is free next time. */
export async function cacheResult(
	env: CloudflareEnv,
	hash: string,
	form: FormDef,
	locale: string,
): Promise<void> {
	const db = getDb(env);
	await db
		.insert(generationCache)
		.values({ promptHash: hash, formDef: form, locale })
		.onConflictDoNothing();
}
