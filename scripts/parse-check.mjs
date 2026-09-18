/**
 * Parser checks for store references, with no network and no server.
 *
 * Kept out of e2e because it needs neither: a wrong id should fail here, in a
 * second, rather than after a round trip that the sandbox cannot make anyway.
 */
import { execFileSync } from "node:child_process";

const cases = [
  ["https://apps.apple.com/us/app/whatsapp-messenger/id310633997", "ios:310633997"],
  ["https://apps.apple.com/es/app/spotify/id324684580?l=en-GB", "ios:324684580"],
  ["https://play.google.com/store/apps/details?id=com.whatsapp", "android:com.whatsapp"],
  ["https://play.google.com/store/apps/details?id=com.spotify.music&hl=es&gl=ES", "android:com.spotify.music"],
  ["310633997", "ios:310633997"],
  ["com.example.app", "android:com.example.app"],
  ["ios:600316760", "ios:600316760"],
  ["android:com.cinder.lab85", "android:com.cinder.lab85"],
  ["  com.example.app  ", "android:com.example.app"],
  ["not an app", null],
  ["", null],
  ["https://example.com/nothing", null],
  ["12345", null],
];

const source = `
  import { parseAppRef } from "@/lib/sources/import";
  const cases = ${JSON.stringify(cases)};
  const out = cases.map(([input]) => {
    const ref = parseAppRef(input);
    return ref ? ref.store + ":" + ref.storeId : null;
  });
  process.stdout.write(JSON.stringify(out));
`;

const got = JSON.parse(execFileSync("npx", ["tsx", "-e", source], { encoding: "utf8" }));

let failed = 0;
cases.forEach(([input, expected], index) => {
  const ok = got[index] === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${JSON.stringify(input)} -> ${got[index]}${ok ? "" : ` (expected ${expected})`}`);
});

console.log(`\n${cases.length - failed}/${cases.length} parser checks passed`);
process.exit(failed === 0 ? 0 : 1);
