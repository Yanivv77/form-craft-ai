import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Builder } from "@/components/builder/Builder";
import { getOptionalUser } from "@/lib/auth/server";
import { getEnv } from "@/lib/cf";
import { getDb } from "@/lib/db/client";
import { getOwnedForm } from "@/lib/forms/queries";

// Reads per-request auth + DB; must not be statically prerendered.
export const dynamic = "force-dynamic";

export default async function EditFormPage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>;
}) {
	const { locale, id } = await params;
	setRequestLocale(locale);

	const user = await getOptionalUser();
	if (!user) notFound();

	const form = await getOwnedForm(getDb(getEnv()), id, user.id);
	if (!form) notFound();

	return (
		<main>
			<Builder
				locale={locale}
				formId={form.id}
				initialForm={{
					title: form.title,
					description: form.description,
					fields: form.fields,
				}}
				initialLocale={form.locale}
			/>
		</main>
	);
}
