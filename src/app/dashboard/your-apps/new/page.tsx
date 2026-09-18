import { PageHeader } from "@/components/layout/page-header";

export default function Page() {
  return (
    <div className="pb-10">
      <PageHeader title="Add App" subtitle="Connect an app by store URL or bundle id." />
      <div className="px-7 py-10">
        <div className="rounded-2xl border border-dashed border-line bg-surface/70 p-10 text-center text-sm text-ink-muted">
          Coming together — this view is being built.
        </div>
      </div>
    </div>
  );
}
