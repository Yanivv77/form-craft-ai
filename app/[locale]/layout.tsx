import "../globals.css";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import type { Metadata } from "next";
import { Figtree, Heebo } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { localeDirection, routing } from "@/i18n/routing";

// Figtree carries all Latin display + text (Pastel's sole family). Heebo covers
// Hebrew glyphs that Figtree lacks, via the per-glyph fallback in --font-sans.
const figtree = Figtree({
	variable: "--font-figtree",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	display: "swap",
});
const heebo = Heebo({
	variable: "--font-heebo",
	subsets: ["hebrew", "latin"],
	weight: ["400", "500", "600"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Form Craft AI",
	description: "AI form builder",
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}
	setRequestLocale(locale);
	const dir = localeDirection(locale);

	return (
		<html
			lang={locale}
			dir={dir}
			data-scroll-behavior="smooth"
			className={`${figtree.variable} ${heebo.variable}`}
		>
			<body className="antialiased">
				{/* Ambient color field + dot matrix behind all content. */}
				<div
					aria-hidden
					className="ambient-bg pointer-events-none fixed inset-0 -z-10"
				/>
				<NextIntlClientProvider>
					<DirectionProvider direction={dir}>
						{/* Full-height column so pages can pin a footer and fill the
						    viewport (header → flex-1 content → footer). */}
						<div className="flex min-h-dvh flex-col">
							<Header />
							{children}
						</div>
					</DirectionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
