import { NextResponse } from "next/server";
import type { RawParams } from "@/lib/search-params";

export function paramsFrom(request: Request): { params: RawParams; url: URL } {
  const url = new URL(request.url);
  const params: RawParams = {};
  for (const key of new Set(url.searchParams.keys())) params[key] = url.searchParams.getAll(key);
  return { params, url };
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "cache-control": "no-store", ...(init?.headers ?? {}) },
  });
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function notFound(message: string) {
  return json({ error: message }, { status: 404 });
}
