import { expect, type Page, test } from "@playwright/test";

async function seedSession(page: Page, email: string) {
	const res = await page.request.post("/api/test/seed-session", {
		data: { email, name: email },
	});
	expect(res.ok(), `seed-session failed: ${res.status()}`).toBeTruthy();
}

test("switching to Hebrew sets RTL and translated UI", async ({ page }) => {
	await page.goto("/en");
	await page.getByTestId("lang-he").click();

	await expect(page).toHaveURL(/\/he$/);
	const html = page.locator("html");
	await expect(html).toHaveAttribute("lang", "he");
	await expect(html).toHaveAttribute("dir", "rtl");

	// A translated string renders (the Hebrew builder hero title).
	await expect(
		page.getByRole("heading", { name: "מה תרצו לשאול?" }),
	).toBeVisible();
});

test("a Hebrew form's public page is RTL for an English-UI viewer", async ({
	page,
}) => {
	const HE_FORM = {
		form: {
			title: "טופס משוב",
			description: "",
			fields: [{ id: "f1", label: "שם", type: "short_text", required: true }],
		},
		locale: "he",
	};
	await page.route("**/api/generate", (route) =>
		route.fulfill({ json: HE_FORM }),
	);
	await seedSession(page, "he-owner@example.com");

	await page.goto("/en");
	await page.getByLabel("Form idea").fill("hebrew feedback form");
	await page.getByTestId("generate").click();
	await expect(page.getByLabel("Form title")).toHaveValue("טופס משוב");
	await page.getByTestId("to-preview").click();
	await page.getByTestId("save-form").click();
	await expect(page).toHaveURL(/\/en\/forms\/[a-z0-9]+$/);

	// The viewer stays on the English UI locale; the form drives direction.
	const shareHref = await page.getByTestId("share-link").getAttribute("href");
	await page.goto(shareHref as string);

	const main = page.locator("main").first();
	await expect(main).toHaveAttribute("dir", "rtl");
	// Public form chrome is rendered in the form's language (Hebrew).
	await expect(page.getByRole("button", { name: "שליחה" })).toBeVisible();
});
