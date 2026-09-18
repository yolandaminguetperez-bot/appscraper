"use server";

import { revalidatePath } from "next/cache";
import { setTrackedNote, trackApp, untrackApp } from "@/lib/db/keywords-query";

export async function trackAppAction(appId: string, role: "own" | "competitor", note?: string) {
  trackApp(appId, role, note);
  revalidatePath("/dashboard/your-apps");
  revalidatePath("/dashboard/competitors");
}

export async function untrackAppAction(appId: string) {
  untrackApp(appId);
  revalidatePath("/dashboard/your-apps");
  revalidatePath("/dashboard/competitors");
}

export async function setTrackedNoteAction(appId: string, note: string) {
  setTrackedNote(appId, note);
  revalidatePath("/dashboard/your-apps");
  revalidatePath("/dashboard/competitors");
}
