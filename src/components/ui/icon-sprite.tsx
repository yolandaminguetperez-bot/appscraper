/**
 * Icons that repeat once per row.
 *
 * Inlining a lucide component per row serialises the same path data dozens of
 * times, into both the HTML and the RSC payload that mirrors it. Defining each
 * shape once and referencing it costs ~60 bytes per use instead of ~400.
 */
export const SPRITE_IDS = {
  star: "spr-star",
  apple: "spr-apple",
  play: "spr-play",
  heart: "spr-heart",
  heartFilled: "spr-heart-filled",
} as const;

export function IconSprite() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <symbol id={SPRITE_IDS.star} viewBox="0 0 24 24">
          <path
            d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.3 6.1 20.4l1.2-6.5L2.5 9.3l6.6-.9z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id={SPRITE_IDS.apple} viewBox="0 0 24 24">
          <path
            d="M15.6 12.4c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7c1.2 0 1.9-1.1 2.6-2.2.8-1.2 1.2-2.4 1.2-2.5 0 0-2-.8-2-3.7zM13.4 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z"
            fill="currentColor"
          />
        </symbol>
        <symbol id={SPRITE_IDS.heart} viewBox="0 0 24 24">
          <path
            d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id={SPRITE_IDS.heartFilled} viewBox="0 0 24 24">
          <path d="M12 20.5 4.2 12.9a4.8 4.8 0 0 1 6.8-6.8l1 1 1-1a4.8 4.8 0 0 1 6.8 6.8z" fill="currentColor" />
        </symbol>
        <symbol id={SPRITE_IDS.play} viewBox="0 0 24 24">
          <path d="M5 3.5v17l13-8.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </symbol>
      </defs>
    </svg>
  );
}

export function SpriteIcon({
  id,
  className,
  title,
}: {
  id: (typeof SPRITE_IDS)[keyof typeof SPRITE_IDS];
  className?: string;
  title?: string;
}) {
  return (
    <svg className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      <use href={`#${id}`} />
    </svg>
  );
}
