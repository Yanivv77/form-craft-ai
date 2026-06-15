import { setRequestLocale } from "next-intl/server";
import { SignInRedirect } from "@/components/auth/SignInRedirect";

// Reads the per-request `next` query param; never statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Keep only same-origin paths so `next` can't become an open redirect after
 * sign-in. Rejects absolute and protocol-relative (`//host`) URLs; falls back
 * to the locale's forms dashboard.
 */
function safeNext(next: string | undefined, locale: string): string {
	if (next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
		return next;
	}
	return `/${locale}/forms`;
}

export default async function SignInPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ next?: string | string[] }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const { next } = await searchParams;
	const target = safeNext(typeof next === "string" ? next : undefined, locale);

	return (
		<main className="grid min-h-[60vh] place-items-center px-4 py-12">
			<SignInRedirect next={target} />
		</main>
	);
}
