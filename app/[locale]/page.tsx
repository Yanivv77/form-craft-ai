import { setRequestLocale } from "next-intl/server";
import { Builder } from "@/components/builder/Builder";
import { Footer } from "@/components/layout/Footer";

// The homepage IS the builder — no marketing page. Everything up to Save is
// anonymous and lives in browser state; the Builder is a client island.
export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<>
			<main className="flex flex-1 flex-col">
				<Builder locale={locale} />
			</main>
			<Footer />
		</>
	);
}
