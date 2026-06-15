import { expect, test } from "@playwright/test";

test("/ redirects to the default locale", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveURL(/\/en\/?$/);
});

test("the homepage is the builder", async ({ page }) => {
	await page.goto("/en");
	// No marketing page — the idea box is the first thing a visitor sees.
	await expect(page.getByLabel("Form idea")).toBeVisible();
	await expect(page.getByTestId("generate")).toBeVisible();
});
