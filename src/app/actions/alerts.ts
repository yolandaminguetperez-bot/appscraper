"use server";

import { revalidatePath } from "next/cache";
import { createAlert, deleteAlert, type AlertMetric } from "@/lib/db/alerts-query";

export async function createAlertAction(input: {
  appId: string;
  metric: AlertMetric;
  direction: "up" | "down";
  threshold: number;
  term?: string | null;
  windowDays?: number;
}) {
  createAlert({
    kind: input.metric === "position" ? "keyword" : "app",
    appId: input.appId,
    term: input.term ?? null,
    metric: input.metric,
    direction: input.direction,
    threshold: input.threshold,
    windowDays: input.windowDays,
  });
  revalidatePath("/dashboard/alerts");
}

export async function deleteAlertAction(id: string) {
  deleteAlert(id);
  revalidatePath("/dashboard/alerts");
}
