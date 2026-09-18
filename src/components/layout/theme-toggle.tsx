"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);

  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {
    // Private mode and blocked storage are fine: the choice just won't persist.
  }
}

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      // Ignore: the default stays "system".
    }
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    apply(next);
  };

  if (collapsed) {
    const next = theme === "dark" ? "light" : "dark";
    const Icon = theme === "dark" ? Sun : Moon;
    return (
      <button
        type="button"
        onClick={() => choose(next)}
        aria-label={`Switch to ${next} theme`}
        className="grid size-8 w-full place-items-center rounded-lg text-panel-ink-muted hover:bg-panel-soft hover:text-panel-ink"
      >
        <Icon className="size-4" />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-xl bg-panel-soft p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => choose(value)}
          aria-pressed={theme === value}
          title={label}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px]",
            theme === value
              ? "bg-accent/15 text-accent"
              : "text-panel-ink-muted hover:text-panel-ink",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
