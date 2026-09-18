/**
 * Renders the sample onboarding screens used by the seeded dataset.
 *
 * Each screen is an original wireframe drawn as SVG — generic shapes and generic
 * copy, modelled on no particular product — so the flow views show screens rather
 * than a list of labels. Real captures replace these once the scrapers can reach
 * the stores.
 * Run: node scripts/make-sample-screens.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";

const OUT = "public/sample-screens";
mkdirSync(OUT, { recursive: true });

const W = 300;
const H = 640;

const INK = "#f2f6f3";
const MUTED = "#8b978f";
const PANEL = "#0c110e";
const CARD = "#18211c";
const ACCENT = "#16c46a";

const rect = (x, y, w, h, fill, r = 8) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;

const text = (x, y, content, { size = 13, fill = INK, weight = 500, anchor = "start" } = {}) =>
  `<text x="${x}" y="${y}" font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${content}</text>`;

const statusBar = () =>
  [rect(20, 22, 34, 6, MUTED, 3), rect(246, 22, 34, 6, MUTED, 3)].join("");

const button = (y, label, { accent = true } = {}) =>
  [
    rect(24, y, W - 48, 46, accent ? ACCENT : CARD, 23),
    text(W / 2, y + 28, label, { size: 14, fill: accent ? PANEL : INK, weight: 600, anchor: "middle" }),
  ].join("");

const bars = (y, rows, width = W - 48) =>
  rows
    .map((w, i) => rect(24, y + i * 16, width * w, 8, "#2a352e", 4))
    .join("");

/** Each screen type gets a layout that reads as that step at thumbnail size. */
const SCREENS = {
  Welcome: () =>
    [
      rect(W / 2 - 34, 150, 68, 68, ACCENT, 20),
      text(W / 2, 268, "Welcome", { size: 24, weight: 700, anchor: "middle" }),
      text(W / 2, 296, "Set up in under a minute", { size: 13, fill: MUTED, weight: 400, anchor: "middle" }),
      button(520, "Get started"),
      text(W / 2, 596, "I already have an account", { size: 12, fill: MUTED, weight: 400, anchor: "middle" }),
    ].join(""),

  Quiz: () =>
    [
      rect(24, 60, W - 48, 5, CARD, 3),
      rect(24, 60, (W - 48) * 0.45, 5, ACCENT, 3),
      text(24, 110, "What brings you here?", { size: 18, weight: 700 }),
      ...[0, 1, 2, 3].map((i) =>
        [
          rect(24, 150 + i * 64, W - 48, 52, i === 1 ? "#14251c" : CARD, 12),
          i === 1 ? rect(W - 56, 168 + i * 64, 16, 16, ACCENT, 8) : "",
          rect(40, 170 + i * 64, 120 + i * 18, 8, "#33413a", 4),
        ].join(""),
      ),
      button(520, "Continue"),
    ].join(""),

  Paywall: () =>
    [
      text(W / 2, 96, "Go unlimited", { size: 22, weight: 700, anchor: "middle" }),
      text(W / 2, 122, "Everything, no limits", { size: 12, fill: MUTED, weight: 400, anchor: "middle" }),
      ...[0, 1, 2].map((i) =>
        [
          rect(24, 150 + i * 26, 14, 14, ACCENT, 7),
          rect(48, 154 + i * 26, 150 - i * 20, 7, "#33413a", 4),
        ].join(""),
      ),
      rect(24, 258, (W - 56) / 2, 120, CARD, 14),
      rect(24 + (W - 56) / 2 + 8, 258, (W - 56) / 2, 120, "#14251c", 14),
      rect(24 + (W - 56) / 2 + 8, 258, (W - 56) / 2, 120, "none", 14).replace(
        'fill="none"',
        `fill="none" stroke="${ACCENT}" stroke-width="2"`,
      ),
      text(52, 296, "Monthly", { size: 12, fill: MUTED, weight: 500 }),
      text(52, 328, "$9", { size: 24, weight: 700 }),
      text(186, 296, "Yearly", { size: 12, fill: MUTED, weight: 500 }),
      text(186, 328, "$0", { size: 24, weight: 700, fill: ACCENT }),
      text(186, 352, "free forever", { size: 11, fill: MUTED, weight: 400 }),
      button(440, "Start free"),
      text(W / 2, 508, "Restore purchase", { size: 11, fill: MUTED, weight: 400, anchor: "middle" }),
    ].join(""),

  Permissions: () =>
    [
      rect(W / 2 - 30, 170, 60, 60, CARD, 18),
      rect(W / 2 - 10, 190, 20, 20, ACCENT, 10),
      text(W / 2, 276, "Stay on track", { size: 19, weight: 700, anchor: "middle" }),
      text(W / 2, 302, "Reminders help you keep", { size: 12, fill: MUTED, weight: 400, anchor: "middle" }),
      text(W / 2, 320, "the streak alive", { size: 12, fill: MUTED, weight: 400, anchor: "middle" }),
      button(480, "Allow notifications"),
      button(536, "Not now", { accent: false }),
    ].join(""),

  Home: () =>
    [
      text(24, 80, "Today", { size: 20, weight: 700 }),
      rect(24, 100, W - 48, 96, CARD, 14),
      rect(40, 120, 90, 8, "#33413a", 4),
      rect(40, 140, 140, 18, ACCENT, 9),
      ...[0, 1, 2].map((i) => rect(24, 214 + i * 64, W - 48, 52, CARD, 12)),
      ...[0, 1, 2].map((i) => rect(40, 234 + i * 64, 110 + i * 22, 8, "#33413a", 4)),
      rect(24, H - 76, W - 48, 52, CARD, 16),
      ...[0, 1, 2, 3].map((i) => rect(48 + i * 60, H - 58, 18, 16, i === 0 ? ACCENT : "#33413a", 5)),
    ].join(""),

  Lesson: () =>
    [
      rect(24, 60, W - 48, 5, CARD, 3),
      rect(24, 60, (W - 48) * 0.7, 5, ACCENT, 3),
      rect(24, 96, W - 48, 180, CARD, 14),
      rect(W / 2 - 24, 166, 48, 40, ACCENT, 10),
      bars(304, [0.9, 0.75, 0.85, 0.5]),
      button(520, "Next"),
    ].join(""),

  "Profile Setup": () =>
    [
      text(24, 96, "About you", { size: 19, weight: 700 }),
      rect(W / 2 - 34, 130, 68, 68, CARD, 34),
      rect(W / 2 - 8, 156, 16, 16, MUTED, 8),
      ...[0, 1, 2].map((i) =>
        [rect(24, 240 + i * 74, W - 48, 54, CARD, 12), rect(40, 258 + i * 74, 80, 7, "#33413a", 4)].join(""),
      ),
      button(500, "Save"),
    ].join(""),

  Success: () =>
    [
      rect(W / 2 - 38, 190, 76, 76, ACCENT, 38),
      text(W / 2, 306, "You're all set", { size: 21, weight: 700, anchor: "middle" }),
      text(W / 2, 332, "Your plan is ready", { size: 12, fill: MUTED, weight: 400, anchor: "middle" }),
      button(520, "Open the app"),
    ].join(""),

  Login: () =>
    [
      text(24, 108, "Welcome back", { size: 19, weight: 700 }),
      rect(24, 150, W - 48, 48, CARD, 12),
      rect(40, 170, 70, 8, "#33413a", 4),
      rect(24, 210, W - 48, 48, CARD, 12),
      rect(40, 230, 100, 8, "#33413a", 4),
      text(W - 24, 286, "Forgot password?", { size: 11, fill: MUTED, weight: 400, anchor: "end" }),
      button(320, "Log in"),
      rect(24, 392, W - 48, 1, "#222d27", 0),
      button(416, "Continue with email", { accent: false }),
      button(472, "Continue with phone", { accent: false }),
    ].join(""),

  "Sign Up": () =>
    [
      text(24, 108, "Create your account", { size: 19, weight: 700 }),
      ...[0, 1, 2].map((i) =>
        [rect(24, 150 + i * 62, W - 48, 48, CARD, 12), rect(40, 170 + i * 62, 90 - i * 10, 8, "#33413a", 4)].join(""),
      ),
      rect(24, 348, 16, 16, CARD, 5),
      rect(48, 352, 170, 7, "#33413a", 4),
      button(400, "Sign up"),
    ].join(""),

  Settings: () =>
    [
      text(24, 88, "Settings", { size: 20, weight: 700 }),
      ...[0, 1, 2, 3, 4].map((i) =>
        [
          rect(24, 120 + i * 62, W - 48, 50, CARD, 12),
          rect(40, 140 + i * 62, 96 - i * 8, 8, "#33413a", 4),
          i < 3
            ? [rect(W - 76, 136 + i * 62, 36, 20, i === 0 ? ACCENT : "#2a352e", 10), rect(i === 0 ? W - 58 : W - 74, 139 + i * 62, 14, 14, PANEL, 7)].join("")
            : rect(W - 50, 140 + i * 62, 10, 8, "#33413a", 4),
        ].join(""),
      ),
    ].join(""),

  Subscription: () =>
    [
      text(24, 92, "Your plan", { size: 19, weight: 700 }),
      rect(24, 120, W - 48, 110, CARD, 14),
      rect(40, 144, 70, 8, "#33413a", 4),
      text(40, 190, "Free", { size: 22, weight: 700, fill: ACCENT }),
      rect(40, 206, 120, 7, "#33413a", 4),
      ...[0, 1, 2, 3].map((i) =>
        [rect(24, 256 + i * 30, 12, 12, ACCENT, 6), rect(44, 259 + i * 30, 160 - i * 16, 7, "#33413a", 4)].join(""),
      ),
      button(456, "Manage plan", { accent: false }),
    ].join(""),

  Discount: () =>
    [
      rect(24, 120, W - 48, 150, "#14251c", 16),
      text(W / 2, 176, "One-time offer", { size: 12, fill: MUTED, weight: 500, anchor: "middle" }),
      text(W / 2, 220, "100% off", { size: 30, weight: 700, fill: ACCENT, anchor: "middle" }),
      text(W / 2, 246, "because it is free", { size: 11, fill: MUTED, weight: 400, anchor: "middle" }),
      rect(24, 300, W - 48, 8, CARD, 4),
      rect(24, 300, (W - 48) * 0.25, 8, ACCENT, 4),
      text(24, 332, "Offer ends soon", { size: 11, fill: MUTED, weight: 400 }),
      button(470, "Claim it"),
    ].join(""),

  "Feature Intro": () =>
    [
      rect(24, 96, W - 48, 210, CARD, 16),
      rect(W / 2 - 40, 170, 80, 62, ACCENT, 14),
      text(24, 350, "Track it once", { size: 19, weight: 700 }),
      bars(376, [0.95, 0.7]),
      ...[0, 1, 2].map((i) => rect(W / 2 - 22 + i * 18, 440, 10, 10, i === 1 ? ACCENT : "#33413a", 5)),
      button(500, "Next"),
    ].join(""),

  Checkout: () =>
    [
      text(24, 92, "Order summary", { size: 18, weight: 700 }),
      ...[0, 1].map((i) =>
        [
          rect(24, 124 + i * 64, 44, 44, CARD, 10),
          rect(80, 138 + i * 64, 120 - i * 20, 8, "#33413a", 4),
          rect(80, 156 + i * 64, 60, 7, "#2a352e", 4),
        ].join(""),
      ),
      rect(24, 268, W - 48, 1, "#222d27", 0),
      text(24, 300, "Total", { size: 13, fill: MUTED, weight: 500 }),
      text(W - 24, 300, "$0.00", { size: 18, weight: 700, anchor: "end" }),
      rect(24, 330, W - 48, 56, CARD, 12),
      rect(40, 350, 40, 16, "#33413a", 4),
      rect(92, 352, 90, 8, "#2a352e", 4),
      button(480, "Place order"),
    ].join(""),

  Preferences: () =>
    [
      text(24, 92, "Pick what matters", { size: 18, weight: 700 }),
      ...[0, 1, 2, 3, 4, 5].map((i) =>
        [
          rect(24 + (i % 2) * ((W - 56) / 2 + 8), 130 + Math.floor(i / 2) * 84, (W - 56) / 2, 72, i === 0 || i === 3 ? "#14251c" : CARD, 12),
          rect(40 + (i % 2) * ((W - 56) / 2 + 8), 150 + Math.floor(i / 2) * 84, 24, 24, i === 0 || i === 3 ? ACCENT : "#33413a", 7),
          rect(40 + (i % 2) * ((W - 56) / 2 + 8), 186 + Math.floor(i / 2) * 84, 60, 7, "#33413a", 4),
        ].join(""),
      ),
      button(500, "Continue"),
    ].join(""),

  Search: () =>
    [
      rect(24, 70, W - 48, 42, CARD, 21),
      rect(44, 87, 16, 8, MUTED, 4),
      ...[0, 1, 2, 3, 4].map((i) =>
        [rect(24, 132 + i * 60, W - 48, 48, CARD, 12), rect(40, 150 + i * 60, 130 - i * 12, 8, "#33413a", 4)].join(""),
      ),
    ].join(""),
};

const DEFAULT = () =>
  [
    text(24, 88, "Step", { size: 18, weight: 700 }),
    bars(124, [0.95, 0.8, 0.6]),
    ...[0, 1, 2].map((i) => rect(24, 210 + i * 70, W - 48, 56, CARD, 12)),
    button(520, "Continue"),
  ].join("");

const TYPES = [
  "Welcome", "Quiz", "Paywall", "Permissions", "Home", "Lesson", "Profile Setup",
  "Success", "Search", "Onboarding", "Content", "Feature Intro", "Preferences",
  "Sign Up", "Settings", "Login", "Subscription", "Discount", "Checkout", "Other",
];

for (const type of TYPES) {
  const body = (SCREENS[type] ?? DEFAULT)();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${type} screen">
<rect width="${W}" height="${H}" fill="${PANEL}"/>
${statusBar()}
${body}
</svg>`;
  writeFileSync(`${OUT}/${type.toLowerCase().replace(/\s+/g, "-")}.svg`, svg);
}

console.log(`rendered ${TYPES.length} sample screens into ${OUT}`);
