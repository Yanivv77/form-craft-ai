import { expect, test } from "@playwright/test";
import messages from "../../messages/en.json";

test("/ redirects to the default locale", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveURL(/\/en\/?$/);
});

test("/en renders the localized heading from messages/en.json", async ({
	page,
}) => {
	await page.goto("/en");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		messages.HomePage.title,
	);
});
