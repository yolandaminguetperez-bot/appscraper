"use client";

import Link from "next/link";
import { useState } from "react";

export type MapShape = {
  code: string;
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label: string;
  href?: string;
};

/**
 * The interactive layer of the map.
 *
 * The native <title> tooltip it replaces waits about a second, cannot be styled
 * and never appears for keyboard users. This one follows the pointer, and focus
 * shows it too, so tabbing through the countries reads the same numbers.
 *
 * Only the countries with data live here; the unshaded base is an image behind
 * it, so the geometry that never changes is not re-sent on every view.
 */
export function MapOverlay({
  width,
  height,
  shapes,
  ariaLabel,
}: {
  width: number;
  height: number;
  shapes: MapShape[];
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);

  return (
    <>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHover(null)}
      >
        {shapes.map((shape) => {
          const show = (event: { clientX: number; clientY: number; currentTarget: Element }) => {
            // Position against the wrapper, not the page: the panel scrolls.
            const box = event.currentTarget.closest("[data-map]")?.getBoundingClientRect();
            if (!box) return;
            setHover({ label: shape.label, x: event.clientX - box.left, y: event.clientY - box.top });
          };

          const path = (
            <path
              d={shape.d}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              className="cursor-pointer transition-opacity hover:opacity-75"
              onMouseMove={show}
              onMouseEnter={show}
              onFocus={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                const wrapper = event.currentTarget.closest("[data-map]")?.getBoundingClientRect();
                if (!wrapper) return;
                setHover({
                  label: shape.label,
                  x: box.left - wrapper.left + box.width / 2,
                  y: box.top - wrapper.top,
                });
              }}
              onBlur={() => setHover(null)}
            />
          );

          return shape.href ? (
            <Link key={shape.code} href={shape.href} aria-label={shape.label}>
              {path}
            </Link>
          ) : (
            <g key={shape.code} tabIndex={0} aria-label={shape.label} role="img">
              {path}
            </g>
          );
        })}
      </svg>

      {hover && (
        <span
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg border border-panel-line bg-panel px-2.5 py-1.5 text-[12px] text-panel-ink shadow-lg"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
        </span>
      )}
    </>
  );
}
