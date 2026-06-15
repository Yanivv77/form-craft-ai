"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Share button that opens a dialog with the form's public link and a copy
 * button. `path` is the locale-prefixed public path (e.g. /en/f/<id>); the
 * absolute URL is built on the client, where the origin is known.
 */
export function ShareDialog({ path }: { path: string }) {
	const t = useTranslations("Dashboard");
	const [url, setUrl] = useState(path);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setUrl(`${window.location.origin}${path}`);
	}, [path]);

	// Clear the "Copied" state after a moment.
	useEffect(() => {
		if (!copied) return;
		const id = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(id);
	}, [copied]);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			// Clipboard may be blocked (insecure context / denied permission); the
			// input stays selectable so the link can still be copied by hand.
		}
	};

	return (
		<Dialog.Root
			onOpenChange={(open) => {
				if (!open) setCopied(false);
			}}
		>
			<Dialog.Trigger
				render={
					<Button type="button" variant="ghost" size="sm" className="gap-1.5" />
				}
			>
				<Share2 className="size-3.5" />
				<span className="hidden sm:inline">{t("share")}</span>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[1px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
				<Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg outline-none transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
					<Dialog.Title className="text-lg font-semibold tracking-tight text-foreground">
						{t("shareTitle")}
					</Dialog.Title>
					<Dialog.Description className="mt-1 text-sm text-muted-foreground">
						{t("shareSubtitle")}
					</Dialog.Description>

					<div className="mt-5 flex items-center gap-2">
						<input
							readOnly
							value={url}
							aria-label={t("shareTitle")}
							onFocus={(e) => e.currentTarget.select()}
							className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
							data-testid="share-url"
						/>
						<Button
							type="button"
							onClick={copy}
							variant={copied ? "secondary" : "default"}
							className="h-10 shrink-0 gap-1.5 px-3"
							data-testid="share-copy"
						>
							{copied ? (
								<Check className="size-4" />
							) : (
								<Copy className="size-4" />
							)}
							{copied ? t("copied") : t("copy")}
						</Button>
					</div>

					<div className="mt-5 flex items-center justify-between gap-2">
						<a
							href={path}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
						>
							<ExternalLink className="size-3.5" />
							{t("openForm")}
						</a>
						<Dialog.Close
							render={<Button type="button" variant="outline" size="sm" />}
						>
							{t("close")}
						</Dialog.Close>
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
