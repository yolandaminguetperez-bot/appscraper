import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { favoriteCounts } from "@/lib/db/favorites";
import { NavIcon } from "@/components/ui/icon";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { kind: "app", href: "/dashboard/favorites/apps", label: "Apps", icon: "apps" },
  { kind: "ad", href: "/dashboard/favorites/ads", label: "Ads", icon: "ads" },
  { kind: "organic", href: "/dashboard/favorites/organic", label: "Organic", icon: "organic" },
] as const;

export default async function FavoritesPage() {
  const counts = favoriteCounts();

  return (
    <div className="pb-12">
      <PageHeader title="All favorites" subtitle="Everything you saved, in one place." />
      <div className="grid gap-4 px-7 pt-5 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.kind}
            href={section.href}
            className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/40"
          >
            <NavIcon name={section.icon} className="size-5 text-accent" />
            <p className="pt-3 text-[15px] font-medium">{section.label}</p>
            <p className="text-[13px] text-ink-muted">
              {counts[section.kind]} saved {counts[section.kind] === 1 ? "item" : "items"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
