"use server";

import { revalidatePath } from "next/cache";
import { importApp, type ImportResult } from "@/lib/sources/import";

export async function importAppAction(input: string): Promise<ImportResult> {
  const result = await importApp(input);
  if (result.ok) {
    revalidatePath("/dashboard/apps");
    revalidatePath("/dashboard/your-apps/new");
  }
  return result;
}
