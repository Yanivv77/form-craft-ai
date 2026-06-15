import { customAlphabet } from "nanoid";

// URL-friendly, lowercase+digits ids for shareable form/response links.
// nanoid uses Web Crypto (crypto.getRandomValues), so it is workerd-safe.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Short id for forms (used in public share links /f/[id]). */
export const newFormId = customAlphabet(alphabet, 12);

/** Short id for responses. */
export const newResponseId = customAlphabet(alphabet, 16);

/** Stable field id — UUID via Web Crypto (answers are keyed by this). */
export function newFieldId(): string {
	return crypto.randomUUID();
}
