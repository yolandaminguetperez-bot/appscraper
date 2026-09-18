PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS apps (
  id                TEXT PRIMARY KEY,           -- "<store>:<store_id>"
  store             TEXT NOT NULL,              -- 'ios' | 'android'
  store_id          TEXT NOT NULL,              -- trackId or package name
  bundle_id         TEXT,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  description       TEXT,
  developer         TEXT,
  developer_id      TEXT,
  developer_url     TEXT,
  icon_url          TEXT,
  store_url         TEXT,
  category          TEXT,
  categories_json   TEXT,
  price             REAL DEFAULT 0,
  currency          TEXT,
  has_iap           INTEGER DEFAULT 0,
  content_rating    TEXT,
  primary_language  TEXT,
  languages_json    TEXT,
  rating            REAL,
  rating_count      INTEGER,
  version           TEXT,
  size_bytes        INTEGER,
  released_at       TEXT,
  updated_at        TEXT,
  screenshots_json  TEXT,
  est_downloads     INTEGER,
  est_revenue       INTEGER,
  est_mrr           INTEGER,
  is_game           INTEGER DEFAULT 0,
  fetched_at        TEXT NOT NULL,
  UNIQUE (store, store_id)
);

CREATE INDEX IF NOT EXISTS idx_apps_store        ON apps (store);
CREATE INDEX IF NOT EXISTS idx_apps_category     ON apps (category);
CREATE INDEX IF NOT EXISTS idx_apps_released     ON apps (released_at);
CREATE INDEX IF NOT EXISTS idx_apps_rating_count ON apps (rating_count);
CREATE INDEX IF NOT EXISTS idx_apps_revenue      ON apps (est_revenue);

CREATE TABLE IF NOT EXISTS app_metrics (
  app_id       TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  day          TEXT NOT NULL,
  rating       REAL,
  rating_count INTEGER,
  rank         INTEGER,
  est_downloads INTEGER,
  est_revenue  INTEGER,
  PRIMARY KEY (app_id, day)
);

-- Growth windows look up a single day across every app, which the (app_id, day)
-- primary key cannot serve.
CREATE INDEX IF NOT EXISTS idx_metrics_day ON app_metrics (day, app_id);

CREATE TABLE IF NOT EXISTS rankings (
  store      TEXT NOT NULL,
  chart      TEXT NOT NULL,   -- 'free' | 'paid' | 'grossing'
  country    TEXT NOT NULL,
  category   TEXT NOT NULL,
  position   INTEGER NOT NULL,
  app_id     TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,
  PRIMARY KEY (store, chart, country, category, position, day)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  app_id     TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  author     TEXT,
  rating     INTEGER,
  title      TEXT,
  body       TEXT,
  version    TEXT,
  country    TEXT,
  posted_at  TEXT,
  sentiment  TEXT,
  topics_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_app ON reviews (app_id, posted_at);

CREATE TABLE IF NOT EXISTS creatives (
  id           TEXT PRIMARY KEY,
  app_id       TEXT REFERENCES apps(id) ON DELETE CASCADE,
  network      TEXT NOT NULL,      -- 'meta' | 'tiktok' | ...
  kind         TEXT NOT NULL,      -- 'video' | 'image' | 'carousel'
  headline     TEXT,
  body         TEXT,
  cta          TEXT,
  media_url    TEXT,
  thumb_url    TEXT,
  landing_url  TEXT,
  first_seen   TEXT,
  last_seen    TEXT,
  days_running INTEGER,
  countries_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_creatives_app ON creatives (app_id);

CREATE TABLE IF NOT EXISTS organic_posts (
  id          TEXT PRIMARY KEY,
  app_id      TEXT REFERENCES apps(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,       -- 'tiktok' | 'instagram' | 'youtube'
  author      TEXT,
  author_followers INTEGER,
  caption     TEXT,
  post_url    TEXT,
  thumb_url   TEXT,
  media_url   TEXT,
  views       INTEGER,
  likes       INTEGER,
  comments    INTEGER,
  posted_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_organic_app ON organic_posts (app_id);

CREATE TABLE IF NOT EXISTS flows (
  id        TEXT PRIMARY KEY,
  app_id    TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  kind      TEXT NOT NULL,         -- 'onboarding' | 'web-funnel'
  title     TEXT,
  captured_at TEXT
);

CREATE TABLE IF NOT EXISTS flow_screens (
  id        TEXT PRIMARY KEY,
  flow_id   TEXT NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  screen_type TEXT,                -- 'paywall' | 'quiz' | 'permissions' | ...
  image_url TEXT,
  note      TEXT
);
CREATE INDEX IF NOT EXISTS idx_screens_flow ON flow_screens (flow_id, position);

CREATE TABLE IF NOT EXISTS keywords (
  id          TEXT PRIMARY KEY,
  term        TEXT NOT NULL,
  store       TEXT NOT NULL,
  country     TEXT NOT NULL,
  volume      INTEGER,
  difficulty  INTEGER,
  checked_at  TEXT,
  UNIQUE (term, store, country)
);

CREATE TABLE IF NOT EXISTS keyword_ranks (
  keyword_id TEXT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  app_id     TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL,
  day        TEXT NOT NULL,
  PRIMARY KEY (keyword_id, app_id, day)
);

-- Where an app's installs and money actually come from. One row per app and
-- country; shares are stored rather than derived so a partial refresh cannot
-- leave a country summing to more than the app's total.
CREATE TABLE IF NOT EXISTS app_countries (
  app_id     TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  country    TEXT NOT NULL,
  downloads  INTEGER NOT NULL DEFAULT 0,
  revenue    INTEGER NOT NULL DEFAULT 0,
  share      REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, country)
);

CREATE INDEX IF NOT EXISTS idx_app_countries_country ON app_countries (country);

-- Rules the user sets once and the app evaluates on every visit.
--
-- No rows are written when a rule fires: an alert is a question asked of the
-- data, and storing "fired" rows would drift out of step with the metrics they
-- came from the moment a refresh changes them. last_seen_value only exists so
-- the feed can say what the number was the last time you looked.
CREATE TABLE IF NOT EXISTS alerts (
  id              TEXT PRIMARY KEY,
  kind            TEXT NOT NULL,        -- 'app' | 'keyword'
  app_id          TEXT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  term            TEXT,                 -- keyword rules only
  metric          TEXT NOT NULL,        -- downloads | revenue | reviews | rating | position
  direction       TEXT NOT NULL,        -- 'up' | 'down'
  threshold       REAL NOT NULL,        -- percent for app metrics, places for a position
  window_days     INTEGER NOT NULL DEFAULT 7,
  created_at      TEXT NOT NULL,
  last_seen_value REAL
);

CREATE INDEX IF NOT EXISTS idx_alerts_app ON alerts (app_id);

CREATE TABLE IF NOT EXISTS favorites (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,        -- 'app' | 'ad' | 'organic'
  ref_id     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (kind, ref_id)
);

-- A saved view is a page plus the query string that produced it, so restoring one
-- is a navigation rather than a re-derivation of filter state.
CREATE TABLE IF NOT EXISTS saved_views (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  path         TEXT NOT NULL,
  query        TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  last_used_at TEXT,
  UNIQUE (path, query)
);

CREATE INDEX IF NOT EXISTS idx_saved_views_path ON saved_views (path, name);

CREATE TABLE IF NOT EXISTS tracked_apps (
  app_id     TEXT PRIMARY KEY REFERENCES apps(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,        -- 'own' | 'competitor'
  added_at   TEXT NOT NULL,
  note       TEXT
);
