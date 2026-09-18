import { PageHeader } from "@/components/layout/page-header";
import { AppPicker } from "@/components/tracking/app-picker";
import { ImportApp } from "@/components/tracking/import-app";
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
      <PageHeader title="Add App" subtitle="Track an app from the catalogue, or bring a new one in from its store." />
      <div className="px-7 pt-5">
        <div className="pb-5">
          <ImportApp />
        </div>
        <AppPicker role="own" results={results} />
        {term && results.length === 0 && (
          <p className="pt-4 text-sm text-ink-muted">Nothing in the catalogue matches “{term}”.</p>
        )}
      </div>
    </div>
  );
}
