// Capture the home page for the README. Defaults to the live site; override with
// SHOT_URL (e.g. http://localhost:8787/en) and SHOT_OUT.
//   node scripts/screenshot.mjs
import { chromium } from "@playwright/test";

const url = process.env.SHOT_URL ?? "https://form-craft-ai.yanivv77.workers.dev/en";
const out = process.env.SHOT_OUT ?? "docs/home.png";

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1280, height: 800 },
	deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200); // let the rise animations and fonts settle
await page.screenshot({ path: out });
await browser.close();
console.log("saved", out);
