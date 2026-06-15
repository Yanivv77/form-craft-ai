/** Clamp an arbitrary locale string to a stored primary subtag (default "en"). */
export function normalizeStoredLocale(value: unknown): string {
	const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
	const primary = raw.split(/[-_]/)[0];
	return /^[a-z]{2,3}$/.test(primary) ? primary : "en";
}
