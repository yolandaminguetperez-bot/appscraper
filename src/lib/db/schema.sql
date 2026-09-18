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

CREATE TABLE IF NOT EXISTS favorites (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,        -- 'app' | 'ad' | 'organic'
  ref_id     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (kind, ref_id)
);

CREATE TABLE IF NOT EXISTS tracked_apps (
  app_id     TEXT PRIMARY KEY REFERENCES apps(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,        -- 'own' | 'competitor'
  added_at   TEXT NOT NULL,
  note       TEXT
);
