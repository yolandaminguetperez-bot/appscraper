import { PageHeader } from "@/components/layout/page-header";
import { CodeBlock } from "@/components/ui/code-block";
import { endpoints } from "@/lib/api-docs";

export const dynamic = "force-dynamic";

/** Stable anchor per endpoint, so the index can jump and links can be shared. */
function slugFor(path: string): string {
  return path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

export default async function ApiPage() {
  return (
    <div className="pb-12">
      <PageHeader title="API" subtitle="Every view in this dashboard is a query you can run yourself." />

      <div className="grid gap-6 px-7 pt-5 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* A dozen endpoints down one column meant scrolling to find anything. */}
        <nav aria-label="Endpoints" className="hidden lg:block">
          <div className="sticky top-4">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Endpoints
            </p>
            <ul className="space-y-0.5">
              {endpoints.map((endpoint) => (
                <li key={endpoint.path}>
                  <a
                    href={`#${slugFor(endpoint.path)}`}
                    className="block truncate rounded-lg px-2 py-1.5 font-mono text-[12px] text-ink-muted hover:bg-surface-muted hover:text-ink"
                  >
                    {endpoint.path.replace("/api/v1", "")}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-4">
          <section className="surface-card p-5">
            <h2 className="text-[15px] font-semibold">Getting started</h2>
            <p className="pt-1 text-[13.5px] leading-relaxed text-ink-muted">
              The API is read-only, returns JSON, needs no key, and accepts the same query parameters the
              dashboard puts in its URL — so you can build a request by filtering a page and copying its
              query string.
            </p>
            <CodeBlock
              className="mt-3"
              code={`curl "http://localhost:3000/api/v1/apps?store=ios&minRating=4&perPage=5"`}
            />
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { term: "Auth", detail: "None. It is your own data." },
                { term: "Format", detail: "JSON, with data / page / total." },
                { term: "Errors", detail: "400 on a bad query, 404 on a missing id." },
              ].map((item) => (
                <div key={item.term} className="rounded-xl bg-surface-muted px-3 py-2.5">
                  <dt className="text-[11px] uppercase tracking-[0.06em] text-ink-faint">{item.term}</dt>
                  <dd className="pt-0.5 text-[12.5px]">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </section>

          {endpoints.map((endpoint) => (
            <section key={endpoint.path} id={slugFor(endpoint.path)} className="surface-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-accent-soft px-2 py-1 font-mono text-[11px] font-semibold text-accent-ink">
                  {endpoint.method}
                </span>
                <code className="font-mono text-[14px] font-medium">{endpoint.path}</code>
              </div>
              <p className="pt-2 text-[13.5px] text-ink-muted">{endpoint.summary}</p>

              <table className="mt-4 w-full border-collapse text-left">
                <caption className="sr-only">Parameters for {endpoint.path}</caption>
                <tbody>
                  {endpoint.params.map((param) => (
                    <tr key={param.name} className="border-t border-line first:border-0">
                      <th
                        scope="row"
                        className="w-[40%] py-2 pr-4 align-top font-mono text-[12px] font-normal text-accent-ink"
                      >
                        {param.name}
                      </th>
                      <td className="py-2 align-top text-[12.5px] text-ink-muted">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <CodeBlock className="mt-4" tone="muted" code={endpoint.example} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
