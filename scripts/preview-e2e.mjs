// Playwright webServer command. Builds the OpenNext bundle, then serves it under
// workerd with test overrides injected via wrangler `--var` (no .dev.vars edit):
//   - E2E_TEST_MODE:true             → enables the guarded test routes
//   - DATABASE_URL:<isolated db>     → only if .test-db-url exists (isolated run)
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const build = spawnSync("pnpm", ["exec", "opennextjs-cloudflare", "build"], {
	stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status ?? 1);

const vars = ["--var", "E2E_TEST_MODE:true"];
if (existsSync(".test-db-url")) {
	const url = readFileSync(".test-db-url", "utf8").trim();
	vars.push("--var", `DATABASE_URL:${url}`);
	console.log("[preview-e2e] serving with isolated test DB");
} else {
	console.log("[preview-e2e] serving with .dev.vars DATABASE_URL");
}

const child = spawn(
	"pnpm",
	["exec", "opennextjs-cloudflare", "preview", ...vars],
	{ stdio: "inherit" },
);
const forward = (sig) => {
	if (!child.killed) child.kill(sig);
};
process.on("SIGTERM", () => forward("SIGTERM"));
process.on("SIGINT", () => forward("SIGINT"));
child.on("exit", (code) => process.exit(code ?? 0));
