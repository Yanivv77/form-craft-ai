"use client";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient, useSession } from "@/lib/auth/client";

export function Header() {
	const t = useTranslations("Header");
	const locale = useLocale();
	const { data: session } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const onForms = pathname.startsWith("/forms");

	// Signed-out users have no /forms page (requireUser redirects them away), so
	// route the intent through Google sign-in and land them back on /forms.
	const signInToForms = () =>
		authClient.signIn.social({
			provider: "google",
			callbackURL: `/${locale}/forms`,
		});

	const myFormsClass = `rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-200 ${
		onForms
			? "bg-secondary text-secondary-foreground"
			: "text-muted-foreground hover:bg-muted hover:text-foreground"
	}`;

	return (
		<header className="sticky top-0 z-40 border-b border-border bg-background">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
				<Link
					href="/"
					className="group flex shrink-0 items-center gap-2.5 font-medium text-foreground"
				>
					{/* Cobalt stamp — the brand mark dot (Pastel's only chromatic logomark). */}
					<span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<Sparkles className="size-4" />
					</span>
					<span className="hidden text-[0.95rem] tracking-tight whitespace-nowrap sm:inline">
						{t("appName")}
					</span>
				</Link>
				<nav className="flex items-center gap-1 sm:gap-1.5">
					{session ? (
						<Link
							href="/forms"
							aria-current={onForms ? "page" : undefined}
							className={myFormsClass}
						>
							{t("myForms")}
						</Link>
					) : (
						<button
							type="button"
							onClick={signInToForms}
							className={myFormsClass}
						>
							{t("myForms")}
						</button>
					)}
					<LanguageSwitcher />
					{session ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={async () => {
								await authClient.signOut();
								router.refresh();
							}}
						>
							{t("signOut")}
						</Button>
					) : (
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={signInToForms}
						>
							{t("signIn")}
						</Button>
					)}
				</nav>
			</div>
		</header>
	);
}
