import type { Field } from "@/lib/forms/types";

export interface Column {
	id: string;
	label: string;
}

export interface ResponseRow {
	answers: Record<string, string | string[]>;
}

/**
 * Columns for the responses table / CSV = the union of the form's current
 * fields and any field ids that appear in stored answers. This keeps answers to
 * removed (hidden) or hard-deleted fields visible instead of silently dropping
 * them. Order: visible fields, then removed fields that have data, then orphans.
 */
export function buildColumns(fields: Field[], rows: ResponseRow[]): Column[] {
	const answeredIds = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row.answers)) answeredIds.add(key);
	}

	const columns: Column[] = [];
	const used = new Set<string>();

	for (const f of fields) {
		if (f.hidden && !answeredIds.has(f.id)) continue;
		columns.push({
			id: f.id,
			label: f.hidden ? `${f.label || f.id} (removed)` : f.label || f.id,
		});
		used.add(f.id);
	}
	// Orphan answer ids (no matching field at all) — label by id.
	for (const id of answeredIds) {
		if (!used.has(id)) {
			columns.push({ id, label: id });
			used.add(id);
		}
	}
	return columns;
}

/** Render one answer cell for display (arrays joined). */
export function formatCell(value: string | string[] | undefined): string {
	if (value == null) return "";
	return Array.isArray(value) ? value.join(", ") : value;
}

/**
 * Escape a CSV cell. Guards against spreadsheet formula injection by prefixing a
 * single quote to any cell that begins with = + - @ (or tab/CR), then quotes as
 * needed.
 */
export function escapeCsvCell(raw: string): string {
	let v = raw ?? "";
	const needsGuard = /^[=+\-@\t\r]/.test(v);
	if (needsGuard) v = `'${v}`;
	if (needsGuard || /[",\n\r]/.test(v)) {
		v = `"${v.replace(/"/g, '""')}"`;
	}
	return v;
}

/** Build a UTF-8 (BOM-prefixed) CSV from union columns + responses. */
export function toCsv(columns: Column[], rows: ResponseRow[]): string {
	const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
	const lines = rows.map((row) =>
		columns.map((c) => escapeCsvCell(formatCell(row.answers[c.id]))).join(","),
	);
	// Leading BOM so Excel reads UTF-8 (Hebrew-safe). CRLF line endings.
	return `﻿${[header, ...lines].join("\r\n")}\r\n`;
}
