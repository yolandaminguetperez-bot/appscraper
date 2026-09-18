/**
 * Renders the sample ad creatives used by the seeded dataset.
 *
 * Original abstract motion graphics — animated gradients and moving shapes, in
 * varied colour schemes — so the creative player has real, good-looking video to
 * play offline. Nothing here is scraped, and no third-party brand or artwork is
 * reproduced. Ad copy is NOT burned in: the player overlays it in the DOM, which
 * keeps the text selectable and the render free of font dependencies.
 *
 * Run: node scripts/make-sample-media.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const OUT = "public/sample-creatives";
if (process.env.CLEAN) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const W = 540;
const H = 960;
const SECONDS = 5;
const FPS = 24;

/** Colour schemes a real ad might use — warm, cool, dark, bright. */
const SCHEMES = [
  { id: "mint", stops: ["0x06281a", "0x0f8a4d", "0x63f0a8"], ink: "0xffffff" },
  { id: "dusk", stops: ["0x1a1038", "0x5b2ea6", "0xc77dff"], ink: "0xffffff" },
  { id: "ember", stops: ["0x2b0f05", "0xc2410c", "0xfbbf24"], ink: "0xffffff" },
  { id: "tide", stops: ["0x042f3d", "0x0e7490", "0x67e8f9"], ink: "0xffffff" },
  { id: "rose", stops: ["0x2d0716", "0xbe185d", "0xfda4af"], ink: "0xffffff" },
  { id: "slate", stops: ["0x0b1220", "0x1e3a8a", "0x93c5fd"], ink: "0xffffff" },
  { id: "citrus", stops: ["0x1a2e05", "0x4d7c0f", "0xd9f99d"], ink: "0xffffff" },
  { id: "plum", stops: ["0x1e0a2e", "0x7e22ce", "0xf0abfc"], ink: "0xffffff" },
];

/** Three compositions, so a grid of creatives does not read as one loop. */
const MOTIONS = ["bloom", "sweep", "orbit"];

function filterFor(scheme, motion, take) {
  const speed = 2.4 + take * 0.5;
  const ink = scheme.ink;

  const shape =
    motion === "bloom"
      ? `drawbox=x='(iw-w)/2':y='(ih-h)/2':w='300+150*sin(2*PI*t/${speed})':h='300+150*sin(2*PI*t/${speed})':color=${ink}@0.16:t=fill`
      : motion === "sweep"
        ? `drawbox=x='-260+iw*1.4*mod(t/${speed}\\,1)':y=0:w=260:h=ih:color=${ink}@0.14:t=fill`
        : `drawbox=x='iw/2-90+230*cos(2*PI*t/${speed})':y='ih/2-90+230*sin(2*PI*t/${speed})':w=180:h=180:color=${ink}@0.18:t=fill`;

  return [
    shape,
    // Blur turns the hard boxes into soft light, which is what reads as design
    // rather than as debug output.
    "boxblur=42:2",
    `drawbox=x='(iw-w)/2':y='ih*0.62':w='iw*0.62':h=3:color=${ink}@0.5:t=fill`,
    "vignette=PI/4",
    "noise=alls=6:allf=t+u",
    "format=yuv420p",
  ].join(",");
}

const made = [];

for (const scheme of SCHEMES) {
  for (const [index, motion] of MOTIONS.entries()) {
    const name = `${scheme.id}-${index + 1}`;
    const mp4 = `${OUT}/${name}.mp4`;
    const jpg = `${OUT}/${name}.jpg`;

    if (!existsSync(mp4)) {
      execFileSync(ffmpeg, [
        "-y", "-loglevel", "error",
        // An animated three-stop gradient carries the colour; the shapes move on top.
        "-f", "lavfi",
        "-i",
        `gradients=s=${W}x${H}:c0=${scheme.stops[0]}:c1=${scheme.stops[1]}:c2=${scheme.stops[2]}` +
          `:x0=0:y0=0:x1=${W}:y1=${H}:nb_colors=3:type=linear:speed=0.06:d=${SECONDS}:r=${FPS}`,
        "-vf", filterFor(scheme, motion, index),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "28",
        "-movflags", "+faststart",
        mp4,
      ]);
    }

    if (!existsSync(jpg)) {
      execFileSync(ffmpeg, [
        "-y", "-loglevel", "error",
        "-i", mp4, "-ss", "2.2", "-frames:v", "1", "-q:v", "4",
        jpg,
      ]);
    }

    made.push(name);
  }
}

console.log(`rendered ${made.length} sample clips into ${OUT}`);
