import { getAppDetail } from "@/lib/db/app-detail";
import { json, notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getAppDetail(decodeURIComponent(id));
  if (!detail) return notFound(`No app with id ${id}`);
  return json({ data: detail });
}
