// Provision a disposable claimable-postgres database (neon.new, no signup, 72h
// TTL), write its URL to .test-db-url, and apply migrations. Used by the
// isolated e2e run so tests never touch the dev/prod database.
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const res = await fetch("https://neon.new/api/v1/database", {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({ ref: "agent-skills" }),
});
if (!res.ok) {
	console.error(`Failed to provision claimable DB: HTTP ${res.status}`);
	process.exit(1);
}

const data = await res.json();
const url = data.connection_string;
if (!url) {
	console.error("No connection_string in neon.new response");
	process.exit(1);
}

writeFileSync(".test-db-url", url, "utf8");
console.log(`Provisioned claimable test DB (expires ${data.expires_at}).`);

execSync("pnpm exec drizzle-kit migrate", {
	stdio: "inherit",
	env: { ...process.env, DATABASE_URL: url },
});
console.log("Migrations applied to the test DB.");
