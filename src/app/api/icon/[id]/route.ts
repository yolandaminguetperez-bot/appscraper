import { iconSvg } from "@/lib/identicon";

/** Icons are a pure function of the id, so they cache hard and never go stale. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return new Response(iconSvg(decodeURIComponent(id)), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
