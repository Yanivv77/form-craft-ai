"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { forms } from "@/lib/db/schema";
import { normalizeStoredLocale } from "@/lib/forms/locale";
import { getOwnedForm } from "@/lib/forms/queries";
import { type FormDefInput, formDefSchema } from "@/lib/forms/schema";
import { newFieldId, newFormId } from "@/lib/ids";

/** Validate untrusted client input and guarantee non-empty, unique field ids. */
function sanitizeFormDef(input: unknown): FormDefInput | null {
	const parsed = formDefSchema.safeParse(input);
	if (!parsed.success) return null;
	const seen = new Set<string>();
	const fields = parsed.data.fields.map((f) => {
		let id = f.id;
		if (!id || seen.has(id)) id = newFieldId();
		seen.add(id);
		return { ...f, id };
	});
	return { ...parsed.data, fields };
}

/** Persist a NEW form for the signed-in user. Returns the new id (client navigates). */
export async function saveForm(input: {
	form: unknown;
	locale: unknown;
}): Promise<{ id: string } | { error: string }> {
	const user = await requireUser();
	const clean = sanitizeFormDef(input.form);
	if (!clean) {
		return { error: "That form looks invalid. Please review your questions." };
	}
	// New form has no responses yet, so removed (hidden) fields can be dropped.
	const fields = clean.fields.filter((f) => !f.hidden);
	if (fields.length === 0) {
		return { error: "Add at least one question before saving." };
	}

	const db = getDb(getEnv());
	const id = newFormId();
	await db.insert(forms).values({
		id,
		ownerId: user.id,
		title: clean.title,
		description: clean.description,
		fields,
		locale: normalizeStoredLocale(input.locale),
	});
	return { id };
}

/** Update an EXISTING owned form. Keeps hidden fields so response ids resolve. */
export async function updateForm(input: {
	id: string;
	form: unknown;
	locale: unknown;
}): Promise<{ id: string } | { error: string }> {
	const user = await requireUser();
	const clean = sanitizeFormDef(input.form);
	if (!clean) {
		return { error: "That form looks invalid. Please review your questions." };
	}
	if (clean.fields.filter((f) => !f.hidden).length === 0) {
		return { error: "Add at least one question before saving." };
	}

	const db = getDb(getEnv());
	const existing = await getOwnedForm(db, input.id, user.id);
	if (!existing) return { error: "Form not found." };

	await db
		.update(forms)
		.set({
			title: clean.title,
			description: clean.description,
			fields: clean.fields,
			locale: normalizeStoredLocale(input.locale),
			updatedAt: new Date(),
		})
		.where(and(eq(forms.id, input.id), eq(forms.ownerId, user.id)));
	return { id: input.id };
}

/** Delete an owned form (responses cascade) and return to the dashboard. */
export async function deleteForm(formData: FormData) {
	const id = String(formData.get("id") ?? "");
	const user = await requireUser();
	const db = getDb(getEnv());
	await db
		.delete(forms)
		.where(and(eq(forms.id, id), eq(forms.ownerId, user.id)));

	const locale = await getLocale();
	redirect(`/${locale}/forms`);
}
