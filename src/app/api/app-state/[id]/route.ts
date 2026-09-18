import { NextResponse } from "next/server";
import { favoriteIds } from "@/lib/db/favorites";
import { trackedApps } from "@/lib/db/keywords-query";

/**
 * Whether this app is favourited or tracked.
 *
 * Kept out of /api/v1/apps/{id}: that is the documented public shape, and this
 * is local interface state that a consumer of the API has no use for.
 */
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appId = decodeURIComponent(id);
  const tracked = trackedApps().find((row) => row.app.id === appId);

  return NextResponse.json({
    favorite: favoriteIds("app").has(appId),
    role: tracked?.role ?? null,
  });
}
