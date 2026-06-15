import type { Field } from "@/lib/forms/types";

export interface ValidationResult {
	ok: boolean;
	/** Keyed by field id; `_form` holds a submission-level error. */
	errors: Record<string, string>;
	/** Cleaned answers, keyed by field id, ready to persist. */
	answers: Record<string, string | string[]>;
}

function isEmpty(value: unknown): boolean {
	if (value == null) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isEmail(s: string): boolean {
	return EMAIL_RE.test(s);
}
function isUrl(s: string): boolean {
	try {
		const u = new URL(s);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}
function isNumber(s: string): boolean {
	return s.trim() !== "" && Number.isFinite(Number(s));
}
function isDate(s: string): boolean {
	return DATE_RE.test(s) && !Number.isNaN(Date.parse(s));
}

/** Type / option-membership / shape check for a non-empty value. */
function validateValue(field: Field, value: unknown): string | null {
	if (field.type === "checkbox") {
		const arr = Array.isArray(value) ? value : [value];
		const options = new Set(field.options ?? []);
		for (const v of arr) {
			if (typeof v !== "string" || !options.has(v)) {
				return "Please choose from the options.";
			}
		}
		return null;
	}

	// Every other type expects a single scalar value.
	if (Array.isArray(value)) return "Invalid value.";
	const s = String(value);

	switch (field.type) {
		case "select":
		case "radio":
			return (field.options ?? []).includes(s)
				? null
				: "Please choose from the options.";
		case "email":
			return isEmail(s) ? null : "Enter a valid email address.";
		case "url":
			return isUrl(s)
				? null
				: "Enter a valid URL (including http:// or https://).";
		case "number":
			return isNumber(s) ? null : "Enter a number.";
		case "date":
			return isDate(s) ? null : "Enter a valid date.";
		default:
			return null; // short_text / long_text
	}
}

function cleanValue(field: Field, value: unknown): string | string[] {
	if (field.type === "checkbox") {
		return (Array.isArray(value) ? value : [value]).map((v) => String(v));
	}
	return String(value);
}

/**
 * Validate a raw submission against a form's fields: required, per-type
 * (email/url/number/date), option membership, array-vs-scalar shape, and
 * rejection of unknown field ids. Answers are keyed by field id.
 */
export function validateSubmission(
	fields: Field[],
	raw: Record<string, unknown>,
): ValidationResult {
	const errors: Record<string, string> = {};
	const answers: Record<string, string | string[]> = {};
	const knownIds = new Set(fields.map((f) => f.id));

	// Reject answer keys that match no field (tampering / stale clients).
	for (const key of Object.keys(raw)) {
		if (!knownIds.has(key)) {
			errors._form = "Your submission contained unexpected fields.";
			break;
		}
	}

	for (const field of fields) {
		// Removed (hidden) fields are not required and not re-validated.
		if (field.hidden) continue;
		const value = raw[field.id];

		if (isEmpty(value)) {
			if (field.required) errors[field.id] = "This field is required.";
			continue;
		}

		const error = validateValue(field, value);
		if (error) {
			errors[field.id] = error;
			continue;
		}
		answers[field.id] = cleanValue(field, value);
	}

	return { ok: Object.keys(errors).length === 0, errors, answers };
}
