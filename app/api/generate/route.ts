import { generateForm, MAX_PROMPT_LENGTH } from "@/lib/ai/generate";
import {
	cacheResult,
	getClientIp,
	preGuard,
	recordCall,
} from "@/lib/ai/guards";
import { getOptionalUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/cf";

// The single anonymous generation endpoint (Browser → here → Gemini). Guards run
// in front of exactly one Gemini call: cache → budget brake → per-IP/user quota.
export async function POST(request: Request): Promise<Response> {
	const env = getEnv();

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = {};
	}
	const raw =
		body && typeof body === "object" && "prompt" in body
			? (body as { prompt?: unknown }).prompt
			: "";
	const prompt = typeof raw === "string" ? raw.trim() : "";

	// Cheap intrinsic checks first — before any counter or call.
	if (!prompt) {
		return Response.json(
			{ error: "Please describe the form you want." },
			{ status: 400 },
		);
	}
	if (prompt.length > MAX_PROMPT_LENGTH) {
		return Response.json(
			{
				error: `Please describe one form in ${MAX_PROMPT_LENGTH} characters or fewer.`,
			},
			{ status: 400 },
		);
	}

	const ip = getClientIp(request);
	const user = await getOptionalUser();
	const userId = user?.id;

	const decision = await preGuard(env, { prompt, ip, userId });
	if (decision.kind === "cache") {
		return Response.json({
			form: decision.form,
			locale: decision.locale,
			cached: true,
		});
	}
	if (decision.kind === "blocked") {
		return Response.json(
			{ error: decision.message, signInPrompt: decision.signInPrompt },
			{ status: decision.status },
		);
	}

	// Exactly one Gemini call, then count it (cost) regardless of outcome.
	const result = await generateForm(env, prompt);
	await recordCall(env, { ip, userId });

	if (!result.ok) {
		return Response.json({ error: result.error }, { status: result.status });
	}
	await cacheResult(env, decision.hash, result.form, result.locale);
	return Response.json({ form: result.form, locale: result.locale });
}
