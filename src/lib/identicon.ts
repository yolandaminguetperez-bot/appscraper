/**
 * Deterministic app artwork.
 *
 * Store icons are hotlinked images we may not have (a blocked scrape, a seeded
 * row). Rather than render a grey box, we draw an original mark from a hash of
 * the app id: same app, same icon, every time, no network. A real `iconUrl`
 * always wins over this.
 */

const PALETTES: [string, string][] = [
  ["#0f9d58", "#16c46a"],
  ["#0b7285", "#22b8cf"],
  ["#5f3dc4", "#845ef7"],
  ["#c2255c", "#f06595"],
  ["#d9480f", "#ff922b"],
  ["#1864ab", "#4dabf7"],
  ["#2b8a3e", "#69db7c"],
  ["#862e9c", "#da77f2"],
  ["#a61e4d", "#f783ac"],
  ["#364fc7", "#748ffc"],
  ["#e67700", "#ffd43b"],
  ["#087f5b", "#38d9a9"],
];

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Six abstract marks, none of them a logo anyone owns. */
function glyph(variant: number, ink: string): string {
  switch (variant % 6) {
    case 0:
      return `<circle cx="50" cy="50" r="19" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round" stroke-dasharray="70 40" transform="rotate(-40 50 50)"/>`;
    case 1:
      return `<path d="M31 62 L50 32 L69 62 Z" fill="${ink}"/>`;
    case 2:
      return `<g fill="${ink}"><rect x="30" y="46" width="10" height="24" rx="5"/><rect x="45" y="34" width="10" height="36" rx="5"/><rect x="60" y="26" width="10" height="44" rx="5"/></g>`;
    case 3:
      return `<path d="M32 50 q18 -26 36 0 q-18 26 -36 0 Z" fill="${ink}"/>`;
    case 4:
      return `<g fill="${ink}"><circle cx="38" cy="38" r="9"/><circle cx="62" cy="38" r="9"/><circle cx="38" cy="62" r="9"/><circle cx="62" cy="62" r="9"/></g>`;
    default:
      return `<path d="M34 66 L50 30 L66 66" fill="none" stroke="${ink}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
}

export function iconSvg(seed: string, size = 100): string {
  const hash = hashString(seed);
  const [from, to] = PALETTES[hash % PALETTES.length];
  const variant = (hash >> 8) % 6;
  const rotation = ((hash >> 16) % 4) * 90;
  const id = `g${hash.toString(36)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${rotation} 0.5 0.5)">
<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
</linearGradient></defs>
<rect width="100" height="100" rx="24" fill="url(#${id})"/>
${glyph(variant, "rgba(255,255,255,0.92)")}
</svg>`;
}
