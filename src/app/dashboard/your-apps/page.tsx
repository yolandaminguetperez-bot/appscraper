import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { TrackedGrid } from "@/components/tracking/tracked-grid";
import { metricsForApps } from "@/lib/db/app-query";
import { trackedApps } from "@/lib/db/keywords-query";

export const dynamic = "force-dynamic";

export default async function YourAppsPage() {
  const entries = trackedApps("own");
  const trends = metricsForApps(entries.map((entry) => entry.app.id));

  return (
    <div className="pb-12">
      <PageHeader
        title="Your Apps"
        subtitle="Track your own apps alongside the rest of the market."
        actions={
          <Link
            href="/dashboard/your-apps/new"
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel hover:bg-accent-ink hover:text-white"
          >
            <Plus className="size-4" />
            Add app
          </Link>
        }
      />
      <div className="px-7 pt-5">
        <TrackedGrid
          entries={entries}
          trends={trends}
          empty={{
            title: "No apps tracked yet",
            body: "Add your own apps to watch their rating, downloads and revenue beside the rest of the market.",
          }}
          emptyAction={{ href: "/dashboard/your-apps/new", label: "Add an app" }}
        />
      </div>
    </div>
  );
}
