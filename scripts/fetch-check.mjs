/**
 * Does this machine reach the stores, and do the scrapers still parse them?
 *
 * Written because the sandbox this project was built in blocks Apple and
 * Google outright, so the adapters have never run against a live response.
 * This turns any machine that does have access into the test rig: one command,
 * and it reports exactly which step fails and what the stores actually returned.
 *
 *   npm run fetch-check
 */
import { execFileSync } from "node:child_process";

const SOURCE = `
import { lookupAppStore } from "@/lib/sources/app-store";
import { playAppDetail } from "@/lib/sources/google-play";

const REQUIRED = ["title", "developer", "iconUrl", "storeUrl", "category"];

function report(label, app) {
  const missing = REQUIRED.filter((field) => !app?.[field]);
  console.log(\`\\n\${label}\`);
  console.log("  title      ", app?.title ?? "—");
  console.log("  developer  ", app?.developer ?? "—");
  console.log("  category   ", app?.category ?? "—");
  console.log("  rating     ", app?.rating ?? "—", "from", app?.ratingCount ?? "—", "ratings");
  console.log("  iconUrl    ", app?.iconUrl ?? "— (no artwork: icons will stay generated)");
  console.log("  est. downloads", app?.estDownloads ?? "—");
  console.log(missing.length ? \`  MISSING: \${missing.join(", ")}\` : "  all required fields present");
  return missing.length === 0;
}

async function main() {
let ok = true;

try {
  // WhatsApp: free, huge, present in every country, so a missing result means
  // the adapter is broken rather than the app being unavailable.
  const [app] = await lookupAppStore(["310633997"]);
  ok = report("App Store (iTunes lookup API)", app) && ok;
} catch (error) {
  ok = false;
  console.log("\\nApp Store (iTunes lookup API)");
  console.log("  FAILED:", error instanceof Error ? error.message : error);
}

try {
  const app = await playAppDetail("com.whatsapp");
  ok = report("Google Play (detail page)", app) && ok;
} catch (error) {
  ok = false;
  console.log("\\nGoogle Play (detail page)");
  console.log("  FAILED:", error instanceof Error ? error.message : error);
}

console.log(
  ok
    ? "\\nBoth stores answered and both adapters parsed them. Real data works here."
    : "\\nSomething above failed. If it says the host could not be reached, it is your network or the store blocking it; if fields are missing, the store changed its shape and the adapter needs updating.",
);
process.exit(ok ? 0 : 1);
}

main();
`;

try {
  execFileSync("npx", ["tsx", "-e", SOURCE], { stdio: "inherit" });
} catch {
  process.exit(1);
}
