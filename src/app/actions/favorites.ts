"use server";

import { revalidatePath } from "next/cache";
import { toggleFavorite, type FavoriteKind } from "@/lib/db/favorites";

export async function toggleFavoriteAction(kind: FavoriteKind, refId: string, path: string) {
  const next = toggleFavorite(kind, refId);
  revalidatePath(path);
  return next;
}
