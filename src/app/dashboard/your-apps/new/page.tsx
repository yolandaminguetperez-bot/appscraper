import { PageHeader } from "@/components/layout/page-header";
import { AppPicker } from "@/components/tracking/app-picker";
import { searchAppsByName } from "@/lib/db/keywords-query";
import type { RawParams } from "@/lib/search-params";

export const dynamic = "force-dynamic";

export default async function AddAppPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const raw = params.q;
  const term = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim();
  const results = term ? searchAppsByName(term) : [];

  return (
    <div className="pb-12">
      <PageHeader title="Add App" subtitle="Pick an app from the catalogue to track it." />
      <div className="px-7 pt-5">
        <AppPicker role="own" results={results} />
        {term && results.length === 0 && (
          <p className="pt-4 text-sm text-ink-muted">Nothing in the catalogue matches “{term}”.</p>
        )}
      </div>
    </div>
  );
}
