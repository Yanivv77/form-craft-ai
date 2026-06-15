import { getOptionalUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { buildColumns, toCsv } from "@/lib/forms/export";
import { getOwnedForm, listResponses } from "@/lib/forms/queries";

// Owner-only CSV export. Anonymous → 401; non-owner / missing → 404.
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const { id } = await params;

	const user = await getOptionalUser();
	if (!user) return new Response("Unauthorized", { status: 401 });

	const db = getDb(getEnv());
	const form = await getOwnedForm(db, id, user.id);
	if (!form) return new Response("Not found", { status: 404 });

	const rows = await listResponses(db, id);
	const columns = buildColumns(form.fields, rows);
	const csv = toCsv(columns, rows);

	const filename = `${form.title || "form"}-responses.csv`.replace(
		/[^a-z0-9.-]+/gi,
		"_",
	);

	return new Response(csv, {
		status: 200,
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": `attachment; filename="${filename}"`,
		},
	});
}
