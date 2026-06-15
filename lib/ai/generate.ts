import { detectLocale, normalizeFormDef } from "@/lib/ai/normalize";
import { GEMINI_RESPONSE_SCHEMA, SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { formDefSchema } from "@/lib/forms/schema";
import type { FormDef } from "@/lib/forms/types";

export const MAX_PROMPT_LENGTH = 800;

export type GenerateResult =
	| { ok: true; form: FormDef; locale: string }
	| { ok: false; status: number; error: string };

/** Pull the concatenated text out of a Gemini generateContent response. */
export function extractText(data: unknown): string {
	const candidates = (data as { candidates?: unknown[] })?.candidates;
	if (!Array.isArray(candidates) || candidates.length === 0) return "";
	const parts = (candidates[0] as { content?: { parts?: unknown[] } })?.content
		?.parts;
	if (!Array.isArray(parts)) return "";
	return parts
		.map((p) => (p as { text?: string })?.text ?? "")
		.join("")
		.trim();
}

/**
 * Parse JSON, with ONE cleanup pass: strip ```json fences / surrounding prose
 * and retry. Returns null if it still can't parse — never a second model call.
 */
export function parseJsonLoose(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		// Fall through to a single cleanup attempt.
	}
	let cleaned = text.trim();
	const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fence) cleaned = fence[1].trim();
	const first = cleaned.indexOf("{");
	const last = cleaned.lastIndexOf("}");
	if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
	try {
		return JSON.parse(cleaned);
	} catch {
		return null;
	}
}

/**
 * The single Gemini chokepoint: exactly one upstream call per request. Layer 7
 * attaches quotas / cache / budget brake in front of this; everything here stays
 * about turning an idea into a validated FormDef.
 */
export async function generateForm(
	env: CloudflareEnv,
	rawPrompt: unknown,
): Promise<GenerateResult> {
	const prompt = typeof rawPrompt === "string" ? rawPrompt.trim() : "";
	if (!prompt) {
		return {
			ok: false,
			status: 400,
			error: "Please describe the form you want.",
		};
	}
	if (prompt.length > MAX_PROMPT_LENGTH) {
		return {
			ok: false,
			status: 400,
			error: `Please describe one form in ${MAX_PROMPT_LENGTH} characters or fewer.`,
		};
	}

	const model = env.GEMINI_MODEL || "gemini-2.5-flash-lite";
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-goog-api-key": env.GEMINI_API_KEY,
			},
			body: JSON.stringify({
				systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
				contents: [{ role: "user", parts: [{ text: prompt }] }],
				generationConfig: {
					responseMimeType: "application/json",
					responseSchema: GEMINI_RESPONSE_SCHEMA,
					temperature: 0.2,
					maxOutputTokens: 2048,
					// Flash-Lite does not think by default; keep it off. Sent best-effort
					// — generation must still succeed if the field is ignored.
					thinkingConfig: { thinkingBudget: 0 },
				},
			}),
		});
	} catch {
		return {
			ok: false,
			status: 502,
			error: "The form generator is unavailable right now. Please try again.",
		};
	}

	if (!response.ok) {
		return {
			ok: false,
			status: 502,
			error:
				"The form generator could not complete your request. Please try again.",
		};
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch {
		return {
			ok: false,
			status: 502,
			error: "The form generator returned an unexpected response.",
		};
	}

	const text = extractText(data);
	if (!text) {
		return {
			ok: false,
			status: 502,
			error: "The form generator returned an empty response. Please try again.",
		};
	}

	const parsed = parseJsonLoose(text);
	if (parsed == null) {
		return {
			ok: false,
			status: 502,
			error: "The form generator returned malformed output. Please try again.",
		};
	}

	const normalized = normalizeFormDef(parsed);
	const result = formDefSchema.safeParse(normalized);
	if (!result.success || result.data.fields.length === 0) {
		return {
			ok: false,
			status: 502,
			error:
				"We couldn't build a valid form from that. Try rephrasing your idea.",
		};
	}

	return { ok: true, form: result.data, locale: detectLocale(parsed) };
}
