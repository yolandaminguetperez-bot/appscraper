/**
 * Deterministic app artwork.
 *
 * Store icons are hotlinked images we may not have (a blocked scrape, a seeded
 * row). Rather than render a grey box, we draw an original mark from a hash of
 * the app id: same app, same icon, every time, no network. A real `iconUrl`
 * always wins over this.
 *
 * These are generated marks, not reproductions: no real brand's artwork is
 * imitated here.
 */

/** Rich two-stop schemes with a matching deep shade for the inner shadow. */
const PALETTES: [string, string][] = [
  ["#0f9d58", "#4ade80"],
  ["#0b7285", "#38d9a9"],
  ["#4c1d95", "#a78bfa"],
  ["#9d174d", "#fb7185"],
  ["#b45309", "#fcd34d"],
  ["#1e40af", "#60a5fa"],
  ["#166534", "#86efac"],
  ["#7e22ce", "#e879f9"],
  ["#9f1239", "#fda4af"],
  ["#3730a3", "#818cf8"],
  ["#c2410c", "#fdba74"],
  ["#065f46", "#5eead4"],
  ["#0c4a6e", "#7dd3fc"],
  ["#831843", "#f9a8d4"],
];

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Ten abstract marks, none of them anyone's logo. */
function glyph(variant: number, ink: string): string {
  switch (variant % 10) {
    case 0:
      return `<circle cx="50" cy="50" r="20" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round" stroke-dasharray="74 40" transform="rotate(-45 50 50)"/>`;
    case 1:
      return `<path d="M30 64 L50 30 L70 64 Z" fill="${ink}"/>`;
    case 2:
      return `<g fill="${ink}"><rect x="28" y="48" width="11" height="24" rx="5.5"/><rect x="44.5" y="34" width="11" height="38" rx="5.5"/><rect x="61" y="26" width="11" height="46" rx="5.5"/></g>`;
    case 3:
      return `<path d="M30 50 q20 -28 40 0 q-20 28 -40 0 Z" fill="${ink}"/>`;
    case 4:
      return `<g fill="${ink}"><circle cx="37" cy="37" r="10"/><circle cx="63" cy="37" r="10"/><circle cx="37" cy="63" r="10"/><circle cx="63" cy="63" r="10"/></g>`;
    case 5:
      return `<path d="M32 68 L50 30 L68 68" fill="none" stroke="${ink}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>`;
    case 6:
      return `<path d="M50 26 L74 50 L50 74 L26 50 Z" fill="none" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/>`;
    case 7:
      return `<g fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"><path d="M30 62 q20 -34 40 0"/><circle cx="50" cy="34" r="4.5" fill="${ink}" stroke="none"/></g>`;
    case 8:
      return `<g fill="${ink}"><rect x="27" y="27" width="20" height="20" rx="6"/><rect x="53" y="27" width="20" height="20" rx="10"/><rect x="27" y="53" width="20" height="20" rx="10"/><rect x="53" y="53" width="20" height="20" rx="6"/></g>`;
    default:
      return `<path d="M50 24 L60 42 L80 46 L65 60 L69 80 L50 70 L31 80 L35 60 L20 46 L40 42 Z" fill="${ink}"/>`;
  }
}

export function iconSvg(seed: string, size = 100): string {
  const hash = hashString(seed);
  const [deep, bright] = PALETTES[hash % PALETTES.length];
  const variant = (hash >> 8) % 10;
  const angle = ((hash >> 16) % 8) * 45;
  const key = hash.toString(36);

  // A squircle, a diagonal gradient, a top highlight and an inner shade: the
  // depth cues that make a flat square read as an app icon.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img">
<defs>
<linearGradient id="g${key}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} 0.5 0.5)">
<stop offset="0" stop-color="${bright}"/><stop offset="1" stop-color="${deep}"/>
</linearGradient>
<linearGradient id="s${key}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
</linearGradient>
</defs>
<rect width="100" height="100" rx="26" fill="url(#g${key})"/>
<rect width="100" height="100" rx="26" fill="url(#s${key})"/>
${glyph(variant, "rgba(255,255,255,0.95)")}
<rect x="1" y="1" width="98" height="98" rx="25" fill="none" stroke="#000000" stroke-opacity="0.12" stroke-width="2"/>
</svg>`;
}
