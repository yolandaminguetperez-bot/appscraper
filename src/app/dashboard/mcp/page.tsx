import { PageHeader } from "@/components/layout/page-header";
import { CodeBlock } from "@/components/ui/code-block";

export const dynamic = "force-dynamic";

const TOOLS = [
  { name: "search_apps", summary: "Filter the catalogue by store, category, rating, size and marketing signals." },
  { name: "get_app", summary: "One app with review history, creatives, creator videos and onboarding screens." },
  { name: "get_rankings", summary: "Top free, paid and grossing charts by store and country." },
  { name: "search_reviews", summary: "Reviews with a rating, sentiment and topic summary." },
  { name: "search_ads", summary: "Advertisers and the creatives they are running." },
  { name: "search_organic", summary: "Creator videos mentioning apps in the catalogue." },
  { name: "search_flows", summary: "Onboarding flows and web funnels, screen by screen." },
  { name: "keyword_stats", summary: "Difficulty, demand proxy and the apps ranking for a term." },
];

const CONFIG = `{
  "mcpServers": {
    "appscraper": {
      "command": "node",
      "args": ["scripts/mcp-server.mjs"],
      "cwd": "/path/to/appscraper",
      "env": { "APPSCRAPER_URL": "http://localhost:3000" }
    }
  }
}`;

export default async function McpPage() {
  return (
    <div className="space-y-5 px-7 pb-12">
      <PageHeader title="MCP" subtitle="Give an AI agent the same data this dashboard runs on." />

      <section className="surface-card p-5">
        <h2 className="text-[15px] font-semibold">How it works</h2>
        <p className="pt-1 text-[13.5px] leading-relaxed text-ink-muted">
          The bundled MCP server speaks JSON-RPC over stdio and forwards each tool call to this
          app&apos;s REST API, so an agent sees exactly what you see. Start the app, point your MCP
          client at the server, and the tools below appear in its tool list.
        </p>
        <CodeBlock
          className="mt-3"
          code={`npm run start          # the app the server reads from
npm run mcp            # the MCP server itself`}
        />
      </section>

      <section className="surface-card p-5">
        <h2 className="text-[15px] font-semibold">Client configuration</h2>
        <p className="pt-1 text-[13.5px] text-ink-muted">
          Add this to your MCP client&apos;s config file, with <code>cwd</code> pointing at your clone.
        </p>
        <CodeBlock className="mt-3" code={CONFIG} />
      </section>

      <section className="surface-card p-5">
        <h2 className="pb-3 text-[15px] font-semibold">Tools ({TOOLS.length})</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.name} className="rounded-xl border border-line bg-surface-muted/60 px-4 py-3">
              <code className="font-mono text-[13px] font-medium text-accent-ink">{tool.name}</code>
              <p className="pt-1 text-[12.5px] leading-relaxed text-ink-muted">{tool.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
