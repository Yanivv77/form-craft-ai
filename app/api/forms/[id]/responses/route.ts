import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { responses } from "@/lib/db/schema";
import { getPublicForm } from "@/lib/forms/queries";
import { validateSubmission } from "@/lib/forms/validate";
import { newResponseId } from "@/lib/ids";

// Anonymous public submission. No auth — respondents are always anonymous.
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const { id } = await params;
	const db = getDb(getEnv());

	const form = await getPublicForm(db, id);
	if (!form) {
		return Response.json({ error: "Form not found" }, { status: 404 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		body = {};
	}
	const rawAnswers =
		body && typeof body === "object" && "answers" in body
			? ((body as { answers?: Record<string, unknown> }).answers ?? {})
			: {};

	const result = validateSubmission(form.fields, rawAnswers);
	if (!result.ok) {
		return Response.json({ errors: result.errors }, { status: 422 });
	}

	await db.insert(responses).values({
		id: newResponseId(),
		formId: id,
		answers: result.answers,
	});

	return Response.json({ ok: true }, { status: 201 });
}
