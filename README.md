# AppScraper

App Store and Google Play market intelligence — free, no account, no paywall. Find apps worth
studying, the ads they run, the creators posting about them, the onboarding flows they ship, and
what their reviewers actually complain about.

## Run it

```bash
npm install
npm run seed     # fills data/appscraper.db with a sample catalogue
npm run dev      # http://localhost:3000
```

`npm run seed` generates a deterministic sample dataset so every view works offline. Real store
data comes from the scrapers in `src/lib/sources/` — press Refresh in any view, or `POST /api/refresh`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run seed` | Regenerate the sample dataset |
| `npm run e2e` | Drive a real browser against a running build (needs `npm run start` first) |
| `npm run stress` | Load test a running build (`--concurrency`, `--seconds`) |
| `npm run ux-check` | Drive the keyboard paths, sorting, filter clearing and focus |
| `npm run preview` | Build a standalone static snapshot into `preview-build/` |
| `npm run shots` | Screenshot dashboard routes into `shots/` |
| `npm run shots-dark` | Screenshot the same routes in dark mode |
| `npm run mcp` | Start the MCP server for AI agents |
| `npm run media` | Re-render the generated sample clips into `public/sample-creatives/` |
| `npm run screens` | Re-render the generated onboarding screens into `public/sample-screens/` |
| `npm run chart-check` | Verify the trend chart's hover readout and table view |

## What is in it

| View | What it answers |
| --- | --- |
| Explore Apps | Which apps match 14 filters across both stores, exportable as CSV |
| Ads Library | Who is advertising, grouped by app or as a flat creative feed |
| Organic | Which creator videos are driving installs |
| Onboardings | How shipping apps sequence their onboarding and paywall screens |
| Trending / Rising | Which apps are gaining users fastest, over 7/30/90 days |
| Store Rankings | Top free, paid and grossing by store and country |
| Review Analytics | Rating mix, sentiment split, and the topics behind complaints |
| Keyword Explorer | How crowded a term is and who owns it today |
| Your Apps / Competitors | The apps you are tracking, yours and theirs |
| Compare apps | Up to four apps side by side, on one revenue scale |
| Overview | The whole catalogue: KPIs, revenue by category, movers |
| Favorites | Saved apps, ads and creator videos |
| API / MCP | The same data from code or from an AI agent |

## API

Read-only, JSON, no key. It accepts the same query parameters the dashboard puts in its URL, so you
can build a request by filtering a page and copying its query string.

```bash
curl "http://localhost:3000/api/v1/apps?store=ios&minRating=4&signal=ads&perPage=5"
```

Endpoints: `/api/v1/apps`, `/api/v1/apps/{id}`, `/api/v1/rankings`, `/api/v1/reviews`, `/api/v1/ads`,
`/api/v1/organic`, `/api/v1/flows`, `/api/v1/keywords`. Full reference at `/dashboard/api`.

## MCP

`npm run mcp` starts a JSON-RPC-over-stdio server exposing eight tools (`search_apps`, `get_app`,
`get_rankings`, `search_reviews`, `search_ads`, `search_organic`, `search_flows`, `keyword_stats`).
It forwards each call to the REST API above, so agents and the UI cannot drift apart. Client
configuration is at `/dashboard/mcp`.

## Charts

Trend charts are inline SVG: a hero total in exact figures, the change against the
previous period, value axes with round ticks, a labelled end point, a hover crosshair
with a per-day readout, and a table view for every value. Chart ink is its own token
(`--chart-line`), separate from the brand accent, because the accent only reaches
2.3:1 against white — below the 3:1 a data mark needs. Both the light and dark steps
are validated against the surface they render on.

## Series colours

The four comparison series use a fixed token order (`--series-1` … `--series-4`),
never cycled, with their own steps per theme. Both sets pass the palette checks
against their surface; the orange/carmine pair sits in the tritan floor band, so
every series also carries a legend entry and a direct end label rather than
relying on hue.

## Static preview

`npm run preview` exports a slice of the catalogue plus the creatives it references
and drops them beside `preview/index.html`, giving a self-contained page that runs
the filters, sorting, charts and video playback with no server behind it. Useful for
sharing what the dashboard looks like without asking anyone to install it; it is a
snapshot, so favourites, saved views and refresh are not part of it.

## Interaction

- **Cmd/Ctrl+K** opens a command palette: search the catalogue, jump to any view,
  switch theme. Arrow keys move, Enter follows, Escape closes.
- **Column headers sort** in place and expose `aria-sort`; the old popover hid
  both the current sort and the alternatives.
- **Filtering runs in a transition** — results dim and a progress bar shows while
  the server renders, instead of the click appearing to do nothing.
- **One button clears every filter**; the chips remove them one at a time.
- **Secondary filters** sit behind one control with a count, so a dozen equal
  pills no longer give the rare filter the same weight as the common one.
- **Saved views** name a set of filters and restore them from the palette on any
  page. The suggested name is built from the filters themselves, and `page` is
  stripped before saving so the same filters never save twice.
- **Keyboard focus is visible everywhere** and a skip link reaches the results.
  The components set `outline-none` for mouse users, which had left keyboard
  users with no indication at all.

## Performance

`npm run stress` drives a weighted mix of pages and API calls at a fixed
concurrency and reports per-route percentiles. On a 4-core box, 16 concurrent
against the sample catalogue: ~55 req/s, p50 204 ms, p95 701 ms, no errors.

Two things dominate at catalogue scale (25k apps, 2.25M metric rows):

- **The driver is synchronous.** better-sqlite3 blocks the event loop, so one
  300 ms aggregate stalls every other in-flight request. Catalogue-wide
  aggregates are memoised in `src/lib/db/cache.ts` and dropped on any write.
- **Page payload, not query time.** The apps table ships ~380 KB, roughly half of
  it the RSC payload mirroring the rendered tree. Row icons are referenced from a
  sprite rather than inlined per row, and row sparklines are downsampled; beyond
  that the lever is fewer rows per page.

Growth windows read the first and last stored day rather than aggregating every
row between them — 383 ms to 131 ms at that scale, and end-vs-start is the
honest definition of growth.

`SEED_APPS=25000 node scripts/seed.mjs` builds a large catalogue to test against.

## Theme

Light and dark are two sets of steps, not an inversion. The toggle lives in the
sidebar (light / dark / follow the system) and is applied before first paint, so a
stored choice never renders one frame in the wrong palette. Dark ink is checked
against every dark surface it lands on: `--ink-faint` was raised from 4.09:1 to
5.10:1 because it labels 11px axis ticks, which need 4.5:1.

## Ver la app

La app no vive en GitHub: GitHub solo guarda el código. Para usarla hay que
ejecutarla en un ordenador. Dos formas.

**1. Con Node (probada).** Necesitas Node 20 o superior:

```bash
git clone -b claude/replicate-appkittie-web-qft5y2 https://github.com/yolandaminguetperez-bot/appscraper
cd appscraper
npm install
npm run seed
npm run dev
```

Abre http://localhost:3000/dashboard/overview. No hace falta base de datos ni
claves: la base es un fichero dentro del proyecto.

**2. Con Docker (sin verificar).** Hay un `Dockerfile` que instala todo y
siembra la base en el primer arranque:

```bash
docker build -t appscraper .
docker run -p 3000:3000 -v appscraper-data:/app/data appscraper
```

No está probado: la máquina donde se escribió tiene el cliente de Docker pero
no el demonio, así que la imagen nunca se ha construido. La vía con Node sí.

### Si `npm install` falla con EACCES o EEXIST

```
npm error code EEXIST
npm error EACCES: permission denied, rename '/Users/<tu-usuario>/.npm/_cacache/...'
```

No es del proyecto: es el caché global de npm, que en macOS suele acabar con
ficheros de root después de un `sudo npm install` en cualquier otro momento.
Devuélvete la propiedad de tu caché y reinstala:

```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

O, si prefieres no usar `sudo`, usa un caché dentro del propio proyecto y no
toques nada del sistema:

```bash
npm install --cache ./.npm-cache
```

Después de esto, `npm run seed` vuelve a funcionar. Si lo ejecutaste antes y
falló con `Cannot find package 'better-sqlite3'`, era la consecuencia de que la
instalación no había llegado a terminar, no un problema aparte.

## Map geometry

`src/lib/geo/world.json` is built by `scripts/make-world-geo.mjs` from Natural
Earth's 110m Admin 0 countries (public domain, no attribution required; credit
given here anyway). The script projects to Equal Earth and rounds coordinates to
whole units in a 1000-wide box, which is a fraction of a pixel at map size: 175
countries in 78KB. Re-run it to refresh or to swap in a finer source:

```bash
node scripts/make-world-geo.mjs            # fetches the source
node scripts/make-world-geo.mjs local.geojson
```

Known source limitation: Singapore is absent from the 110m dataset.

## Sample media

`public/sample-creatives/` holds generated motion graphics rendered by
`scripts/make-sample-media.mjs` — animated gradients and moving shapes across eight
colour schemes, so the creative player has real, varied video to play offline.
Nothing there is scraped or third-party, and ad copy is overlaid in the DOM rather
than burned into the frame, which keeps it selectable.

**Importing real apps.** The sample catalogue is invented, so its apps have no
store artwork to fetch. To bring in a real one, open **Add App** and paste a
store link or id — an App Store URL, a Google Play URL, a numeric track id or a
package name all resolve:

```
https://apps.apple.com/us/app/whatsapp-messenger/id310633997
https://play.google.com/store/apps/details?id=com.whatsapp
com.spotify.music
```

The parsing runs offline (`npm run parse-check`); the fetch needs
`itunes.apple.com` or `play.google.com` to be reachable. Where they are not,
the importer says so rather than reporting "app not found" — a blocked host and
a wrong id are different problems and send you looking in different places.

**App icons.** Every view shows the app's own store artwork whenever the row has
one: `icon_url` is captured by both adapters (`artworkUrl512` on iTunes, the
icon from the Play detail page) and always wins. The generated mark in
`src/lib/identicon.ts` is a fallback for exactly two cases — a row whose artwork
has not been fetched yet, and an `icon_url` that fails to load — so a blocked or
dead CDN degrades to a placeholder instead of a broken image.

To fill in artwork for rows that lack it:

```bash
node scripts/backfill-icons.mjs --check   # are the store hosts reachable?
node scripts/backfill-icons.mjs           # fetch and store the real icons
```

Where Apple's and Google's hosts are blocked (`is1-ssl.mzstatic.com`,
`play-lh.googleusercontent.com`, `itunes.apple.com`, `play.google.com` — the
sandbox this was built in answers 403 to all four), no original artwork can be
fetched and the script says so instead of half-filling the table. Note also that
a seeded catalogue has no original icons to fetch at all: those apps are
generated samples, not real store listings. Real artwork arrives with real apps,
through the scrapers.

## Estimates, and what they are worth

Stores do not publish download or revenue figures. `src/lib/sources/estimates.ts` derives them from
signals that *are* public — rating volume, app age, price, whether in-app purchases exist. Read them
as orders of magnitude for comparing apps, not as facts. Google Play's own install bracket is used
when available, in preference to the derived number.

## Network access

The scrapers talk to `itunes.apple.com`, `rss.applemarketingtools.com` and `play.google.com`. Some
sandboxes block those hosts; the app still runs fully on seeded data, and Refresh reports which
hosts it could not reach rather than failing silently.

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/dashboard/*` | One route per dashboard view |
| `src/app/api/v1/*` | The public read-only API |
| `src/components/filters/*` | URL-backed filter primitives shared by every view |
| `src/lib/db/*` | SQLite schema, repositories and query builders |
| `src/lib/sources/*` | Store scrapers, refresh pipeline and the estimate model |
| `scripts/*` | Seeder, e2e checks, screenshots, MCP server |

## Deployment

The app keeps its data in a local SQLite file, so it needs a host with a persistent disk (a small VM
or container), not a serverless platform. Point `APPSCRAPER_DB` at the database file you want to use.
