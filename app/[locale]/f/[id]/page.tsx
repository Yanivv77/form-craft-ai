import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PublicForm } from "@/components/forms/PublicForm";
import { loadMessages } from "@/i18n/messages";
import { localeDirection } from "@/i18n/routing";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { getPublicForm } from "@/lib/forms/queries";

// Reads per-request DB via getEnv(); must not be statically prerendered.
export const dynamic = "force-dynamic";

export default async function PublicFormPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>;
}) {
	const { locale, id } = await params;
	setRequestLocale(locale);

	const form = await getPublicForm(getDb(getEnv()), id);
	if (!form) notFound();

	// Render in the FORM's own language + direction, independent of the viewer's
	// UI locale, so a shared Hebrew form is RTL + Hebrew for everyone.
	const dir = localeDirection(form.locale);
	const messages = await loadMessages(form.locale);

	return (
		<main className="px-4" dir={dir}>
			<NextIntlClientProvider locale={form.locale} messages={messages}>
				<PublicForm
					formId={form.id}
					title={form.title}
					description={form.description}
					fields={form.fields}
				/>
			</NextIntlClientProvider>
		</main>
	);
}
