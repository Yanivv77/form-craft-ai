import { Download, Inbox, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { deleteForm } from "@/lib/forms/actions";
import { buildColumns, formatCell } from "@/lib/forms/export";
import { getOwnedForm, listResponses } from "@/lib/forms/queries";

// Reads per-request auth + DB via getEnv(); must not be statically prerendered.
export const dynamic = "force-dynamic";

export default async function FormOwnerPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>;
}) {
	const { locale, id } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("OwnerForm");

	// Not owner (or anonymous) → 404, which also avoids leaking existence.
	const user = await getOptionalUser();
	if (!user) notFound();

	const db = getDb(getEnv());
	const form = await getOwnedForm(db, id, user.id);
	if (!form) notFound();

	const rows = await listResponses(db, id);
	const columns = buildColumns(form.fields, rows);
	const shareHref = `/${locale}/f/${form.id}`;

	return (
		<main className="animate-rise mx-auto max-w-4xl px-4 py-12">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
					{form.title}
				</h1>
				<div className="flex items-center gap-1">
					<Link href={`/${locale}/forms/${form.id}/edit`}>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="gap-1.5"
						>
							<Pencil className="size-3.5" />
							{t("edit")}
						</Button>
					</Link>
					<form action={deleteForm}>
						<input type="hidden" name="id" value={form.id} />
						<Button
							type="submit"
							variant="ghost"
							size="sm"
							className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="size-3.5" />
							{t("delete")}
						</Button>
					</form>
				</div>
			</div>

			<div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border bg-card px-4 py-3 text-sm">
				<span className="text-muted-foreground">{t("shareLink")}</span>
				<a
					className="font-medium text-primary underline-offset-4 hover:underline"
					href={shareHref}
					data-testid="share-link"
				>
					{shareHref}
				</a>
			</div>

			<div className="mt-10 flex items-center justify-between gap-3">
				<h2 className="text-lg font-medium text-foreground">
					{t("responses", { count: rows.length })}
				</h2>
				{rows.length > 0 ? (
					<a href={`/api/forms/${form.id}/export`} data-testid="export-csv">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="gap-1.5"
						>
							<Download className="size-3.5" />
							{t("exportCsv")}
						</Button>
					</a>
				) : null}
			</div>

			{rows.length === 0 ? (
				<div
					className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"
					data-testid="no-responses"
				>
					<span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
						<Inbox className="size-6" />
					</span>
					<p className="mt-4 text-muted-foreground">{t("noResponses")}</p>
				</div>
			) : (
				<div className="mt-4 overflow-x-auto rounded-lg border border-border bg-card">
					<table
						className="w-full border-collapse text-sm"
						data-testid="responses-table"
					>
						<thead>
							<tr className="border-b border-border bg-muted/40 text-start">
								{columns.map((col) => (
									<th
										key={col.id}
										className="px-4 py-3 text-start font-medium whitespace-nowrap text-foreground"
									>
										{col.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr
									key={row.id}
									className="border-b border-border transition-colors last:border-0 hover:bg-muted/60"
								>
									{columns.map((col) => (
										<td
											key={col.id}
											className="px-4 py-3 align-top text-foreground tabular-nums"
										>
											{formatCell(row.answers[col.id])}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</main>
	);
}
