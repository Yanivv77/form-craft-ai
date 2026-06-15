import { useTranslations } from "next-intl";

export default function NotFound() {
	const t = useTranslations("NotFound");

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-3xl font-bold">{t("title")}</h1>
			<p className="text-muted-foreground">{t("description")}</p>
		</main>
	);
}
