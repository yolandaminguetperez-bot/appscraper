"use server";

import { revalidatePath } from "next/cache";
import {
  deleteSavedView,
  renameSavedView,
  saveView,
  touchSavedView,
  type SavedView,
} from "@/lib/db/saved-views";

export async function saveViewAction(name: string, path: string, query: string): Promise<SavedView> {
  const view = saveView(name, path, query);
  revalidatePath(path);
  return view;
}

export async function deleteSavedViewAction(id: string, path: string): Promise<void> {
  deleteSavedView(id);
  revalidatePath(path);
}

export async function renameSavedViewAction(id: string, name: string, path: string): Promise<void> {
  renameSavedView(id, name);
  revalidatePath(path);
}

export async function touchSavedViewAction(id: string): Promise<void> {
  touchSavedView(id);
}
