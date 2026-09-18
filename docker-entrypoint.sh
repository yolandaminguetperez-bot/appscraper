#!/bin/sh
set -e

if [ ! -f /app/data/appscraper.db ]; then
  echo "No database found — loading the sample catalogue (this takes a few seconds)…"
  node scripts/seed.mjs
else
  echo "Using the existing database at /app/data/appscraper.db"
fi

exec "$@"
