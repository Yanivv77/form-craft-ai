import { FileText, Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShareDialog } from "@/components/forms/ShareDialog";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { deleteForm } from "@/lib/forms/actions";
import { listFormsByOwner } from "@/lib/forms/queries";

// Reads per-request auth + DB via getEnv(); must not be statically prerendered.
export const dynamic = "force-dynamic";

export default async function FormsDashboardPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("Dashboard");

	const user = await requireUser(`/${locale}/forms`);
	const myForms = await listFormsByOwner(getDb(getEnv()), user.id);
	const fmtDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

	return (
		<main className="animate-rise mx-auto max-w-3xl px-4 py-12">
			<div className="flex items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
						{t("title")}
					</h1>
					{myForms.length > 0 ? (
						<p className="mt-1 text-sm text-muted-foreground">
							{t("formCount", { count: myForms.length })}
						</p>
					) : null}
				</div>
				<Link href={`/${locale}`}>
					<Button type="button" className="h-10 gap-2 px-4">
						<Plus className="size-4" />
						{t("newForm")}
					</Button>
				</Link>
			</div>

			{myForms.length === 0 ? (
				<div className="mt-10 flex flex-col items-center rounded-lg border border-border bg-card p-12 text-center">
					<span className="flex size-14 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
						<FileText className="size-7" />
					</span>
					<p className="mt-5 font-medium text-foreground">{t("emptyLead")}</p>
					<p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
						{t("emptySub")}
					</p>
					<Link href={`/${locale}`} className="mt-5">
						<Button type="button" className="h-10 gap-2 px-4">
							<Plus className="size-4" />
							{t("emptyCta")}
						</Button>
					</Link>
				</div>
			) : (
				<ul className="mt-8 flex flex-col gap-3" data-testid="forms-list">
					{myForms.map((form) => (
						<li
							key={form.id}
							className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors duration-200 hover:border-foreground/20"
						>
							<Link
								href={`/${locale}/forms/${form.id}`}
								className="flex min-w-0 items-center gap-3 text-foreground"
							>
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-200 group-hover:bg-secondary group-hover:text-foreground">
									<FileText className="size-4" />
								</span>
								<span className="min-w-0">
									<span className="block truncate font-medium group-hover:text-primary">
										{form.title}
									</span>
									<span className="mt-0.5 block truncate text-xs text-muted-foreground">
										{t("questionsCount", {
											count: form.fields.filter((f) => !f.hidden).length,
										})}
										{" · "}
										{t("updated", {
											date: fmtDate.format(new Date(form.updatedAt)),
										})}
									</span>
								</span>
							</Link>
							<div className="flex shrink-0 items-center gap-0.5">
								<Link
									href={`/${locale}/forms/${form.id}`}
									data-testid="view-responses"
								>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="gap-1.5"
									>
										<Inbox className="size-3.5" />
										<span className="hidden sm:inline">{t("responses")}</span>
									</Button>
								</Link>
								<Link href={`/${locale}/forms/${form.id}/edit`}>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="gap-1.5"
									>
										<Pencil className="size-3.5" />
										<span className="hidden sm:inline">{t("edit")}</span>
									</Button>
								</Link>
								<ShareDialog path={`/${locale}/f/${form.id}`} />
								<form action={deleteForm}>
									<input type="hidden" name="id" value={form.id} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										aria-label={t("delete")}
										className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 className="size-3.5" />
										<span className="hidden sm:inline">{t("delete")}</span>
									</Button>
								</form>
							</div>
						</li>
					))}
				</ul>
			)}
		</main>
	);
}
