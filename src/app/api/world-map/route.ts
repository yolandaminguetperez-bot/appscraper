import world from "@/lib/geo/world.json";

/**
 * The base world map as a cacheable image.
 *
 * Inlining 175 country paths into the page cost ~156KB, because a server
 * component's output is serialised twice: once as HTML and again in the RSC
 * payload that mirrors it. The geometry never changes, so it is served once and
 * cached forever, and the page inlines only the handful of countries that carry
 * data and need to be hoverable and clickable.
 *
 * An <img> cannot inherit the page's CSS variables, so the SVG carries its own
 * stylesheet — including the dark-mode query, which an image does honour.
 */
export const dynamic = "force-static";

const BODY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${world.width} ${world.height}" width="${world.width}" height="${world.height}" role="img" aria-label="World map"><style>
  path { fill: #dfe4e0; stroke: #ffffff; stroke-width: 1; }
  @media (prefers-color-scheme: dark) { path { fill: #232b26; stroke: #111714; } }
</style>${world.countries.map((country) => `<path d="${country.d}"/>`).join("")}</svg>`;

export function GET() {
  return new Response(BODY, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
