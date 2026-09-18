/**
 * MCP server exposing the AppScraper dataset to AI agents over stdio.
 *
 * It speaks JSON-RPC 2.0 over stdin/stdout and forwards each tool call to the
 * local REST API, so the agent sees exactly what the dashboard sees.
 *
 * Usage: APPSCRAPER_URL=http://localhost:3000 node scripts/mcp-server.mjs
 */
import { createInterface } from "node:readline";

const BASE = process.env.APPSCRAPER_URL ?? "http://localhost:3000";
const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "search_apps",
    description:
      "Search the App Store and Google Play catalogue with filters for store, category, rating, downloads, revenue and marketing signals.",
    endpoint: "/api/v1/apps",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search text" },
        store: { type: "string", enum: ["ios", "android"] },
        cat: { type: "string", description: "Category to include" },
        minRating: { type: "number" },
        minDownloads: { type: "number" },
        minRevenue: { type: "number" },
        signal: { type: "string", enum: ["ads", "organic", "onboarding"] },
        sort: {
          type: "string",
          enum: ["revenue", "downloads", "rating", "reviews", "released", "updated", "title"],
        },
        perPage: { type: "number", description: "Results per page, max 200" },
      },
    },
  },
  {
    name: "get_app",
    description: "Fetch one app with review history, creatives, creator videos and onboarding screens.",
    endpoint: "/api/v1/apps/{id}",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Composite id, e.g. ios:600316760" } },
      required: ["id"],
    },
  },
  {
    name: "get_rankings",
    description: "Top charts by store, chart type and country.",
    endpoint: "/api/v1/rankings",
    inputSchema: {
      type: "object",
      properties: {
        store: { type: "string", enum: ["ios", "android"] },
        chart: { type: "string", enum: ["free", "paid", "grossing"] },
        country: { type: "string" },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "search_reviews",
    description: "Reviews plus a rating, sentiment and topic summary for the same filter.",
    endpoint: "/api/v1/reviews",
    inputSchema: {
      type: "object",
      properties: {
        app: { type: "string" },
        q: { type: "string" },
        sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
        topic: { type: "string" },
        window: { type: "number", description: "Only reviews from the last N days" },
      },
    },
  },
  {
    name: "search_ads",
    description: "Apps running paid creatives, or the creatives themselves when view is 'ads'.",
    endpoint: "/api/v1/ads",
    inputSchema: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["grouped", "ads"] },
        cat: { type: "string" },
        minMrr: { type: "number" },
        minDays: { type: "number", description: "Creative running at least N days" },
      },
    },
  },
  {
    name: "search_organic",
    description: "Creator videos mentioning apps in the catalogue.",
    endpoint: "/api/v1/organic",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["tiktok", "instagram", "youtube"] },
        minViews: { type: "number" },
        sort: { type: "string", enum: ["views", "likes", "recent", "followers"] },
      },
    },
  },
  {
    name: "search_flows",
    description: "Onboarding flows and web funnels, screen by screen.",
    endpoint: "/api/v1/flows",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["onboarding", "web-funnel"] },
        screen: { type: "string", description: "Only flows containing this screen type" },
      },
    },
  },
  {
    name: "keyword_stats",
    description: "Keyword difficulty, demand proxy and the apps ranking for a term.",
    endpoint: "/api/v1/keywords",
    inputSchema: {
      type: "object",
      properties: { term: { type: "string" } },
      required: ["term"],
    },
  },
];

async function callTool(name, args = {}) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);

  let path = tool.endpoint;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === "") continue;
    const placeholder = `{${key}}`;
    if (path.includes(placeholder)) {
      path = path.replace(placeholder, encodeURIComponent(String(value)));
    } else {
      query.set(key, String(value));
    }
  }

  const url = `${BASE}${path}${query.toString() ? `?${query}` : ""}`;
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} from ${url}: ${body.slice(0, 200)}`);
  return body;
}

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(request) {
  const { id, method, params } = request;

  if (method === "initialize") {
    return {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "appscraper", version: "1.0.0" },
    };
  }

  if (method === "tools/list") {
    return {
      tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    };
  }

  if (method === "tools/call") {
    const text = await callTool(params?.name, params?.arguments ?? {});
    return { content: [{ type: "text", text }] };
  }

  if (method === "ping") return {};

  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

const rl = createInterface({ input: process.stdin });

rl.on("line", async (line) => {
  if (!line.trim()) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }

  // Notifications carry no id and expect no reply.
  if (request.id === undefined) return;

  try {
    send({ jsonrpc: "2.0", id: request.id, result: await handle(request) });
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id: request.id,
      error: { code: error.code ?? -32000, message: error.message },
    });
  }
});
