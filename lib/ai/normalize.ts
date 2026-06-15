import { MAX_FIELDS, MAX_OPTIONS } from "@/lib/forms/schema";
import {
	CHOICE_TYPES,
	FIELD_TYPES,
	type Field,
	type FieldType,
	type FormDef,
	TEXT_LIKE_TYPES,
} from "@/lib/forms/types";
import { newFieldId } from "@/lib/ids";

// Map common model synonyms to canonical field types.
const TYPE_SYNONYMS: Record<string, FieldType> = {
	text: "short_text",
	"short text": "short_text",
	string: "short_text",
	input: "short_text",
	name: "short_text",
	textarea: "long_text",
	"long text": "long_text",
	paragraph: "long_text",
	multiline: "long_text",
	comment: "long_text",
	mail: "email",
	"e-mail": "email",
	link: "url",
	website: "url",
	uri: "url",
	num: "number",
	integer: "number",
	float: "number",
	decimal: "number",
	datetime: "date",
	day: "date",
	dropdown: "select",
	"single select": "select",
	single_select: "select",
	"multiple choice": "radio",
	multiple_choice: "radio",
	choice: "radio",
	option: "radio",
	checkboxes: "checkbox",
	"multi select": "checkbox",
	multi_select: "checkbox",
	multiselect: "checkbox",
};

function canonicalType(raw: unknown): FieldType | null {
	if (typeof raw !== "string") return null;
	const key = raw.trim().toLowerCase();
	if ((FIELD_TYPES as readonly string[]).includes(key)) return key as FieldType;
	return TYPE_SYNONYMS[key] ?? null;
}

function normalizeOptions(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	const result: string[] = [];
	for (const item of raw) {
		const opt = String(item).trim();
		if (!opt || seen.has(opt)) continue;
		seen.add(opt);
		result.push(opt);
		if (result.length >= MAX_OPTIONS) break;
	}
	return result;
}

/** Normalize one raw model field into a clean Field, or null if unusable. */
export function normalizeField(raw: unknown): Field | null {
	if (!raw || typeof raw !== "object") return null;
	const r = raw as Record<string, unknown>;

	const label = typeof r.label === "string" ? r.label.trim() : "";
	if (!label) return null;

	let type = canonicalType(r.type) ?? "short_text";
	const options = normalizeOptions(r.options);

	// A choice field with no usable options is demoted to free text.
	if (CHOICE_TYPES.has(type) && options.length === 0) type = "short_text";

	const field: Field = {
		id: newFieldId(),
		label,
		type,
		required: r.required === true,
	};

	if (CHOICE_TYPES.has(type)) field.options = options;
	if (
		TEXT_LIKE_TYPES.has(type) &&
		typeof r.placeholder === "string" &&
		r.placeholder.trim()
	) {
		field.placeholder = r.placeholder.trim();
	}

	return field;
}

/**
 * Turn untrusted model output into a clean FormDef: map type synonyms, demote
 * choice-without-options to text, assign Web-Crypto ids, strip placeholders on
 * non-text types, and clamp to the field/option caps. Always returns a value;
 * the caller Zod-validates the result.
 */
export function normalizeFormDef(raw: unknown): FormDef {
	const r = (raw && typeof raw === "object" ? raw : {}) as Record<
		string,
		unknown
	>;

	const title =
		typeof r.title === "string" && r.title.trim()
			? r.title.trim()
			: "Untitled form";
	const description =
		typeof r.description === "string" ? r.description.trim() : "";

	const rawFields = Array.isArray(r.fields) ? r.fields : [];
	const fields: Field[] = [];
	for (const rawField of rawFields) {
		if (fields.length >= MAX_FIELDS) break;
		const field = normalizeField(rawField);
		if (field) fields.push(field);
	}

	return { title, description, fields };
}

/** Detected content locale (lowercased BCP-47-ish), defaulting to "en". */
export function detectLocale(raw: unknown): string {
	const r = raw as Record<string, unknown> | null;
	const value =
		r && typeof r.locale === "string" ? r.locale.trim().toLowerCase() : "";
	// Keep the primary subtag only (e.g. "en-US" → "en"); guard the shape.
	const primary = value.split(/[-_]/)[0];
	return /^[a-z]{2,3}$/.test(primary) ? primary : "en";
}
