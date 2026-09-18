# AppScraper

App Store and Google Play market intelligence — free, no paywall. A working rebuild of the
kind of dashboard app-marketing teams use to find apps, ads, creator videos and onboarding
flows worth studying.

## Preview it locally

```bash
git clone -b claude/replicate-appkittie-web-qft5y2 https://github.com/yolandaminguetperez-bot/appscraper
cd appscraper
npm install
npm run seed     # fills data/appscraper.db with a sample catalogue
npm run dev      # http://localhost:3000
```

`npm run seed` generates a deterministic sample dataset so every view is usable offline.
Real store data comes from the scrapers in `src/lib/sources/` (see *Network access* below).

## Screenshots without running it

```bash
npm run build && npm run start &
npm run shots                        # writes shots/*.png
npm run shots /dashboard/ads         # or capture specific routes
```

## Network access

The scrapers talk to `itunes.apple.com`, `rss.applemarketingtools.com` and `play.google.com`.
Some sandboxes block those hosts; when they are blocked the app still runs on seeded data.

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/dashboard/*` | One route per dashboard view |
| `src/components/filters/*` | URL-backed filter primitives shared by every view |
| `src/lib/db/*` | SQLite schema, repositories and query builders |
| `src/lib/sources/*` | Store scrapers and the download/revenue estimate model |
| `scripts/seed.mjs` | Sample dataset generator |

## Estimates

Stores do not publish download or revenue figures. `src/lib/sources/estimates.ts` derives them
from public signals (rating volume, age, price, IAP presence). Read them as orders of
magnitude, not facts.
