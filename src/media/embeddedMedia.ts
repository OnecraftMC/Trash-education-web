/**
 * The embedded media strings, moved verbatim out of the legacy
 * `index.html` VID object and poster attribute. The payloads stay
 * embedded in application code and are never re-encoded or served from
 * the network; see the migration design spec.
 */
import background from "./inline/background.txt?raw";
import animation1 from "./inline/animation-1.txt?raw";
import animation2 from "./inline/animation-2.txt?raw";
import animation3 from "./inline/animation-3.txt?raw";
import animation1r from "./inline/animation-1r.txt?raw";
import animation2r from "./inline/animation-2r.txt?raw";
import animation3r from "./inline/animation-3r.txt?raw";
import posterRaw from "./inline/poster.txt?raw";

export type VideoId =
  | "background"
  | "animation-1"
  | "animation-2"
  | "animation-3"
  | "animation-1r"
  | "animation-2r"
  | "animation-3r";

/** The seven video IDs, in legacy DOM order. */
export const VIDEO_IDS: readonly VideoId[] = [
  "background",
  "animation-1",
  "animation-2",
  "animation-3",
  "animation-1r",
  "animation-2r",
  "animation-3r",
];

/** Removes only the text-file line ending Vite's raw import keeps. */
function stripLineEnding(raw: string): string {
  return raw.replace(/\r?\n$/, "");
}

export const videoPayloads: Readonly<Record<VideoId, string>> = {
  background: stripLineEnding(background),
  "animation-1": stripLineEnding(animation1),
  "animation-2": stripLineEnding(animation2),
  "animation-3": stripLineEnding(animation3),
  "animation-1r": stripLineEnding(animation1r),
  "animation-2r": stripLineEnding(animation2r),
  "animation-3r": stripLineEnding(animation3r),
};

export const posterDataUri: string = stripLineEnding(posterRaw);
