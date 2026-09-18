import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import path from "node:path";

let instance: Database.Database | null = null;

export function db(): Database.Database {
  if (instance) return instance;

  const file = process.env.APPSCRAPER_DB ?? path.join(process.cwd(), "data", "appscraper.db");
  mkdirSync(path.dirname(file), { recursive: true });

  const conn = new Database(file);
  conn.pragma("foreign_keys = ON");
  conn.exec(readFileSync(path.join(process.cwd(), "src/lib/db/schema.sql"), "utf8"));

  instance = conn;
  return conn;
}
