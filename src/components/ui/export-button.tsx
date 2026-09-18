import { Download } from "lucide-react";
import Link from "next/link";

/** Same affordance on every list page: take what is on screen as a CSV. */
export function ExportButton({ href, label = "Export CSV" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-panel transition-colors hover:bg-accent-ink hover:text-white"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </Link>
  );
}
