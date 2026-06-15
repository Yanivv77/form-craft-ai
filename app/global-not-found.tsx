import "./globals.css";
import type { Metadata } from "next";

// Rendered for URLs that match no route at all (outside the [locale] segment),
// so there is no locale context here. Requires `experimental.globalNotFound`.
export const metadata: Metadata = {
	title: "Page not found — Form Craft AI",
};

export default function GlobalNotFound() {
	return (
		<html lang="en">
			<body className="antialiased">
				<main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
					<h1 className="text-3xl font-bold">404 — Page not found</h1>
					<p>This page could not be found.</p>
				</main>
			</body>
		</html>
	);
}
