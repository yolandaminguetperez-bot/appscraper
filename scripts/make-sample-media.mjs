/**
 * Renders the sample ad creatives and creator clips used by the seeded dataset.
 *
 * These are generated motion graphics — abstract shapes only — so the player has
 * real video to play offline. Nothing here is scraped or third-party. Ad copy is
 * NOT burned in: the player overlays it in the DOM, which keeps the text
 * selectable and the render free of font dependencies.
 * Run: node scripts/make-sample-media.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const OUT = "public/sample-creatives";
mkdirSync(OUT, { recursive: true });

const W = 540;
const H = 960;
const SECONDS = 5;

// Each variant is a different look, so a grid of creatives does not read as one clip.
const VARIANTS = [
  { id: "pulse", base: "0x0c110e", accent: "0x16c46a", motion: "pulse" },
  { id: "sweep", base: "0x101c16", accent: "0x2ee07f", motion: "sweep" },
  { id: "orbit", base: "0x0a1410", accent: "0x14b563", motion: "orbit" },
  { id: "rise", base: "0x121a15", accent: "0x3ae98d", motion: "rise" },
];

/** Four takes per variant, so a grid of creatives does not read as one loop. */
const TAKES = [0, 1, 2, 3];

/** Motion is built from ffmpeg's own generators — no source footage involved. */
function filterFor(variant, take) {
  const { accent, motion } = variant;
  const speed = 2.2 + take * 0.45;

  const shape =
    motion === "pulse"
      ? `drawbox=x=(iw-w)/2:y=(ih-h)/2:w='240+140*sin(2*PI*t/${speed})':h='240+140*sin(2*PI*t/${speed})':color=${accent}@0.85:t=fill`
      : motion === "sweep"
        ? `drawbox=x='-200+iw*1.2*mod(t/${speed}\\,1)':y=0:w=220:h=ih:color=${accent}@0.75:t=fill`
        : motion === "orbit"
          ? `drawbox=x='iw/2-70+200*cos(2*PI*t/${speed})':y='ih/2-70+200*sin(2*PI*t/${speed})':w=140:h=140:color=${accent}@0.9:t=fill`
          : `drawbox=x=(iw-w)/2:y='ih-(ih*mod(t/${speed}\\,1))':w=300:h=300:color=${accent}@0.8:t=fill`;

  return [
    shape,
    "boxblur=22:1",
    "vignette",
  ].join(",");
}

const made = [];

for (const variant of VARIANTS) {
  for (const take of TAKES) {
    const name = `${variant.id}-${take + 1}`;
    const mp4 = `${OUT}/${name}.mp4`;
    const jpg = `${OUT}/${name}.jpg`;

    if (!existsSync(mp4)) {
      execFileSync(ffmpeg, [
        "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", `color=c=${variant.base}:s=${W}x${H}:d=${SECONDS}:r=24`,
        "-vf", filterFor(variant, take),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "30",
        "-movflags", "+faststart",
        mp4,
      ]);
    }

    if (!existsSync(jpg)) {
      execFileSync(ffmpeg, [
        "-y", "-loglevel", "error",
        "-i", mp4, "-ss", "1.5", "-frames:v", "1", "-q:v", "6",
        jpg,
      ]);
    }

    made.push(name);
  }
}

console.log(`rendered ${made.length} sample clips into ${OUT}`);
