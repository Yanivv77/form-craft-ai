/**
 * The form-definition contract — the central artifact of the app.
 *
 * The AI produces it, the DB stores it (forms.fields jsonb), the renderer
 * renders it, submissions are validated against it, and CSV columns derive
 * from it. Answers are keyed by field `id`, NEVER by label.
 */

/** Canonical field types — the single source of truth (runtime + type). */
export const FIELD_TYPES = [
	"short_text",
	"long_text",
	"email",
	"url",
	"number",
	"date",
	"select",
	"radio",
	"checkbox",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export interface Field {
	/** Stable, server-assigned (Web Crypto). Answers are keyed by this id. */
	id: string;
	label: string;
	type: FieldType;
	required: boolean;
	/** Text-like types only. */
	placeholder?: string;
	/** Required for select / radio / checkbox. */
	options?: string[];
	/** Soft-delete: never hard-remove a field that may already have responses. */
	hidden?: boolean;
}

export interface FormDef {
	title: string;
	description: string;
	fields: Field[];
}

/** Field types that accept free text (and therefore a placeholder). */
export const TEXT_LIKE_TYPES: ReadonlySet<FieldType> = new Set([
	"short_text",
	"long_text",
	"email",
	"url",
	"number",
	"date",
]);

/** Field types that require an `options` list. */
export const CHOICE_TYPES: ReadonlySet<FieldType> = new Set([
	"select",
	"radio",
	"checkbox",
]);

/** Field types whose answer is an array (multi-select). */
export const MULTI_VALUE_TYPES: ReadonlySet<FieldType> = new Set(["checkbox"]);
