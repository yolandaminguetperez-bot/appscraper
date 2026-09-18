import { PageHeader } from "@/components/layout/page-header";
import { endpoints } from "@/lib/api-docs";

export const dynamic = "force-dynamic";

export default async function ApiPage() {
  return (
    <div className="space-y-5 px-7 pb-12">
      <PageHeader
        title="API"
        subtitle="Every view in this dashboard is a query you can run yourself."
      />

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[15px] font-semibold">Getting started</h2>
        <p className="pt-1 text-[13.5px] text-ink-muted">
          The API is read-only, returns JSON, needs no key, and accepts the same query parameters the
          dashboard puts in its URL — so you can build a request by filtering a page and copying its
          query string.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-panel p-4 text-[12.5px] text-panel-ink">
          <code>{`curl "http://localhost:3000/api/v1/apps?store=ios&minRating=4&perPage=5"`}</code>
        </pre>
      </section>

      <div className="space-y-4">
        {endpoints.map((endpoint) => (
          <section key={endpoint.path} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-semibold text-accent-ink">
                {endpoint.method}
              </span>
              <code className="text-[13.5px] font-medium">{endpoint.path}</code>
            </div>
            <p className="pt-2 text-[13.5px] text-ink-muted">{endpoint.summary}</p>

            <dl className="mt-3 space-y-1.5">
              {endpoint.params.map((param) => (
                <div key={param.name} className="flex flex-wrap gap-x-3 text-[12.5px]">
                  <dt className="font-mono text-accent-ink">{param.name}</dt>
                  <dd className="text-ink-muted">{param.description}</dd>
                </div>
              ))}
            </dl>

            <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-muted p-3 text-[12px]">
              <code>{endpoint.example}</code>
            </pre>
          </section>
        ))}
      </div>
    </div>
  );
}
