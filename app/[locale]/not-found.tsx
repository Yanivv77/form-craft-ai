import { ArrowLeft, Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
	const t = useTranslations("NotFound");

	return (
		<main className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
			<div className="animate-rise flex max-w-md flex-col items-center rounded-lg border border-border bg-card p-10">
				<span className="flex size-14 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
					<Compass className="size-7" />
				</span>
				<h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
					{t("title")}
				</h1>
				<p className="mt-2 text-muted-foreground">{t("description")}</p>
				<Link href="/" className="mt-6">
					<Button type="button" variant="outline" className="gap-2">
						<ArrowLeft className="size-4 rtl:rotate-180" />
						{t("backHome")}
					</Button>
				</Link>
			</div>
		</main>
	);
}
