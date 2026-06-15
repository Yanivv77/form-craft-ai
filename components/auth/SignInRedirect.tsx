"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth/client";

/**
 * Lands signed-out users in the Google sign-in flow and returns them to `next`.
 * `next` is a sanitized same-origin path (see the /signin page). Already
 * signed-in visitors are forwarded straight to `next` instead.
 */
export function SignInRedirect({ next }: { next: string }) {
	const t = useTranslations("SignIn");
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const started = useRef(false);

	const startSignIn = () =>
		authClient.signIn.social({ provider: "google", callbackURL: next });

	useEffect(() => {
		// Wait for the session check, then act once (guards React strict-mode
		// double-invocation before the browser navigates away).
		if (isPending || started.current) return;
		started.current = true;
		if (session) {
			router.replace(next);
		} else {
			void authClient.signIn.social({ provider: "google", callbackURL: next });
		}
	}, [isPending, session, next, router]);

	return (
		<div className="flex w-full max-w-sm flex-col items-center rounded-lg border border-border bg-card p-8 text-center">
			<span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
				<Loader2 className="size-5 animate-spin" />
			</span>
			<h1 className="mt-5 text-lg font-medium text-foreground">
				{t("heading")}
			</h1>
			<p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
			{/* Fallback if the automatic redirect is blocked. */}
			<Button type="button" onClick={startSignIn} className="mt-6 h-10 w-full">
				{t("cta")}
			</Button>
		</div>
	);
}
