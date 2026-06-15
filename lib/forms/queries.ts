import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { forms, responses } from "@/lib/db/schema";

/** Public read — anyone can fetch a form to render its public page. */
export async function getPublicForm(db: Db, id: string) {
	const rows = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
	return rows[0] ?? null;
}

/** Owner-scoped read — ownership is in the WHERE clause, so non-owners get null. */
export async function getOwnedForm(db: Db, id: string, ownerId: string) {
	const rows = await db
		.select()
		.from(forms)
		.where(and(eq(forms.id, id), eq(forms.ownerId, ownerId)))
		.limit(1);
	return rows[0] ?? null;
}

/** All forms owned by a user, newest first. */
export async function listFormsByOwner(db: Db, ownerId: string) {
	return db
		.select()
		.from(forms)
		.where(eq(forms.ownerId, ownerId))
		.orderBy(desc(forms.updatedAt));
}

/** Responses for a form, newest first. */
export async function listResponses(db: Db, formId: string) {
	return db
		.select()
		.from(responses)
		.where(eq(responses.formId, formId))
		.orderBy(desc(responses.createdAt));
}
