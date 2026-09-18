import { lookupAppStore } from "@/lib/sources/app-store";
import { playAppDetail } from "@/lib/sources/google-play";
import { getApp, upsertApps } from "@/lib/db/apps-repo";
import type { App } from "@/lib/types";

export type AppRef = { store: "ios" | "android"; storeId: string };

/**
 * Works out which app a pasted string refers to.
 *
 * People paste whatever their browser gave them: a store URL with locale and
 * tracking parameters, a bare bundle id, an "ios:123" id copied from this app's
 * own tables. All of them resolve here, offline, so a typo fails immediately
 * with a readable message instead of after a round trip to the store.
 */
export function parseAppRef(input: string): AppRef | null {
  const value = input.trim();
  if (!value) return null;

  // This app's own composite id, which is what its tables and API hand out.
  const composite = value.match(/^(ios|android):(.+)$/i);
  if (composite) {
    return { store: composite[1].toLowerCase() as AppRef["store"], storeId: composite[2] };
  }

  // Apple: .../app/whatever/id123456789, with anything after it.
  const appleUrl = value.match(/apps\.apple\.com\/[^\s]*\/id(\d+)/i);
  if (appleUrl) return { store: "ios", storeId: appleUrl[1] };

  // Apple's older and API-facing hosts.
  const appleId = value.match(/itunes\.apple\.com\/[^\s]*\/id(\d+)/i) ?? value.match(/[?&]id=(\d{6,})/);
  if (appleId && /apple|itunes/i.test(value)) return { store: "ios", storeId: appleId[1] };

  // Google: ...store/apps/details?id=com.example.app
  const playUrl = value.match(/play\.google\.com\/[^\s]*[?&]id=([A-Za-z0-9._]+)/i);
  if (playUrl) return { store: "android", storeId: playUrl[1] };

  // A bare numeric id is an App Store track id; a dotted identifier is a
  // Play package name. Nothing else is a reference we can resolve.
  if (/^\d{6,}$/.test(value)) return { store: "ios", storeId: value };
  if (/^[a-z][a-z0-9_]*(\.[a-z0-9_]+){1,}$/i.test(value)) return { store: "android", storeId: value };

  return null;
}

export type ImportResult =
  | { ok: true; app: App; alreadyKnown: boolean }
  | { ok: false; reason: "unparsed" | "not-found" | "unreachable"; detail: string };

/**
 * Fetches one app from its store and writes it to the catalogue.
 *
 * The unreachable case is separated from not-found on purpose: a blocked host
 * and a wrong id are different problems with different fixes, and reporting a
 * network policy as "app not found" sends people hunting for a typo that isn't
 * there.
 */
export async function importApp(input: string): Promise<ImportResult> {
  const ref = parseAppRef(input);
  if (!ref) {
    return {
      ok: false,
      reason: "unparsed",
      detail: "Paste an App Store or Google Play link, a numeric App Store id, or a package name.",
    };
  }

  let app: App | undefined;
  try {
    if (ref.store === "ios") {
      const results = await lookupAppStore([ref.storeId]);
      app = results[0];
    } else {
      app = await playAppDetail(ref.storeId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      reason: "unreachable",
      detail: `Could not reach the store (${message}). The App Store and Google Play hosts are blocked in some networks.`,
    };
  }

  if (!app) {
    return { ok: false, reason: "not-found", detail: `The store has no app with id ${ref.storeId}.` };
  }

  const alreadyKnown = Boolean(getApp(`${ref.store}:${ref.storeId}`));
  upsertApps([app]);
  return { ok: true, app, alreadyKnown };
}
