// Run the full e2e suite against a fresh, disposable claimable-postgres DB.
// Provisions + migrates, runs Playwright, then removes .test-db-url so later
// plain runs fall back to .dev.vars.
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

let code = 1;
try {
	const setup = spawnSync("node", ["scripts/setup-test-db.mjs"], {
		stdio: "inherit",
	});
	if (setup.status !== 0) process.exit(setup.status ?? 1);

	const test = spawnSync("pnpm", ["exec", "playwright", "test"], {
		stdio: "inherit",
	});
	code = test.status ?? 1;
} finally {
	rmSync(".test-db-url", { force: true });
}
process.exit(code);
