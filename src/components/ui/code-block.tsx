import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/cn";

export function CodeBlock({
  code,
  tone = "dark",
  className,
}: {
  code: string;
  tone?: "dark" | "muted";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        tone === "dark" ? "bg-panel text-panel-ink" : "border border-line bg-surface-muted",
        className,
      )}
    >
      <pre className="scroll-thin overflow-x-auto p-4 pr-12 text-[12.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
      <CopyButton
        value={code}
        className={cn(
          "absolute right-2 top-2",
          tone === "dark" && "border-panel-line bg-panel-soft text-panel-ink-muted hover:text-panel-ink",
        )}
      />
    </div>
  );
}
