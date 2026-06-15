import { expect, test } from "@playwright/test";
import { extractText, parseJsonLoose } from "@/lib/ai/generate";
import {
	detectLocale,
	normalizeField,
	normalizeFormDef,
} from "@/lib/ai/normalize";
import { formDefSchema } from "@/lib/forms/schema";

test.describe("normalize", () => {
	test("maps type synonyms and assigns ids", () => {
		const out = normalizeFormDef({
			title: "Survey",
			description: "",
			fields: [
				{ label: "Name", type: "text", required: true },
				{ label: "Bio", type: "textarea", required: false },
				{ label: "Email", type: "mail", required: true },
				{ label: "Site", type: "link", required: false },
				{
					label: "Pick",
					type: "dropdown",
					required: false,
					options: ["A", "B"],
				},
			],
		});
		expect(out.fields.map((f) => f.type)).toEqual([
			"short_text",
			"long_text",
			"email",
			"url",
			"select",
		]);
		for (const f of out.fields) expect(f.id).toMatch(/^[0-9a-f-]{36}$/);
	});

	test("demotes a choice field with no options to short_text", () => {
		const f = normalizeField({ label: "Pick", type: "radio", required: false });
		expect(f?.type).toBe("short_text");
		expect(f?.options).toBeUndefined();
	});

	test("clamps fields to 12, options to 8, and de-dupes options", () => {
		const fields = Array.from({ length: 20 }, (_, i) => ({
			label: `Q${i}`,
			type: "short_text",
			required: false,
		}));
		expect(
			normalizeFormDef({ title: "Big", description: "", fields }).fields,
		).toHaveLength(12);

		const choice = normalizeField({
			label: "Pick",
			type: "checkbox",
			required: false,
			options: ["a", "a", "b", "c", "d", "e", "f", "g", "h", "i"],
		});
		expect(choice?.options).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
	});

	test("strips placeholder on non-text types and drops empty labels", () => {
		const sel = normalizeField({
			label: "Pick",
			type: "select",
			required: false,
			placeholder: "no",
			options: ["A", "B"],
		});
		expect(sel?.placeholder).toBeUndefined();
		expect(
			normalizeField({ label: "", type: "short_text", required: false }),
		).toBeNull();
	});

	test("detectLocale reads the primary subtag and defaults to en", () => {
		expect(detectLocale({ locale: "he" })).toBe("he");
		expect(detectLocale({ locale: "en-US" })).toBe("en");
		expect(detectLocale({})).toBe("en");
		expect(detectLocale({ locale: "garbage123" })).toBe("en");
	});

	test("normalized output passes the Zod schema", () => {
		const out = normalizeFormDef({
			title: "Contact",
			description: "Reach us",
			fields: [{ label: "Email", type: "email", required: true }],
		});
		expect(formDefSchema.safeParse(out).success).toBe(true);
	});
});

test.describe("parseJsonLoose", () => {
	test("parses plain JSON", () => {
		expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
	});
	test("strips markdown fences", () => {
		expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
	});
	test("extracts JSON from surrounding prose", () => {
		expect(parseJsonLoose('Sure! {"a":1} hope that helps')).toEqual({ a: 1 });
	});
	test("returns null on garbage", () => {
		expect(parseJsonLoose("not json at all")).toBeNull();
	});
});

test.describe("extractText", () => {
	test("concatenates candidate parts", () => {
		const data = {
			candidates: [{ content: { parts: [{ text: '{"a":' }, { text: "1}" }] } }],
		};
		expect(extractText(data)).toBe('{"a":1}');
	});
	test("returns empty string when candidates are missing", () => {
		expect(extractText({})).toBe("");
	});
});

test.describe("/api/generate caps (no Gemini call)", () => {
	test("rejects an empty prompt with 400", async ({ request }) => {
		const res = await request.post("/api/generate", { data: { prompt: "  " } });
		expect(res.status()).toBe(400);
	});

	test("rejects an over-long prompt with a friendly 400", async ({
		request,
	}) => {
		const res = await request.post("/api/generate", {
			data: { prompt: "x".repeat(1001) },
		});
		expect(res.status()).toBe(400);
		const body = (await res.json()) as { error?: string };
		expect(body.error).toMatch(/800 characters/);
	});
});
