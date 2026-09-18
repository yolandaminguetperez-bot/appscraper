/**
 * Pulls one real app into the local catalogue from the command line.
 *
 *   npm run import -- https://apps.apple.com/us/app/whatsapp-messenger/id310633997
 *   npm run import -- com.spotify.music
 *
 * The same code the Add App page uses; this exists so a machine with store
 * access can populate the catalogue without clicking through the interface.
 */
import { execFileSync } from "node:child_process";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run import -- <store link or app id>");
  process.exit(1);
}

const SOURCE = `
import { importApp } from "@/lib/sources/import";

async function main() {
const result = await importApp(${JSON.stringify(input)});

if (result.ok) {
  console.log(\`\${result.alreadyKnown ? "Updated" : "Imported"} \${result.app.title}\`);
  console.log("  id       ", result.app.id);
  console.log("  developer", result.app.developer ?? "—");
  console.log("  artwork  ", result.app.iconUrl ?? "— (none, the generated mark stays)");
  console.log("\\nOpen /dashboard/apps/" + encodeURIComponent(result.app.id));
} else {
  console.error(result.detail);
  process.exit(1);
}
}

main();
`;

try {
  execFileSync("npx", ["tsx", "-e", SOURCE], { stdio: "inherit" });
} catch {
  process.exit(1);
}
