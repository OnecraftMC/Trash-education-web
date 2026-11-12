import { useEffect, useRef, useState } from "react";
import { posterDataUri, videoPayloads } from "../media/embeddedMedia";
import type { VideoId } from "../media/embeddedMedia";
import { createVideoSources } from "../media/videoSources";
import {
  createVideoPlayerController,
  type BinColor,
  type PlaybackState,
  type VideoPlayerController,
} from "./interactive-scene/videoPlayer";
import { positionHotspots } from "./interactive-scene/positionHotspots";

const VIDEO_IDS: VideoId[] = [
  "background",
  "animation-1",
  "animation-2",
  "animation-3",
  "animation-1r",
  "animation-2r",
  "animation-3r",
];

const HOTSPOT_LABELS: Record<BinColor, string> = {
  blue: "Tong sampah biru: mulai animasi",
  green: "Tong sampah hijau: mulai animasi",
  gray: "Tong sampah abu-abu: mulai animasi",
};

const CHIP_LABELS: Record<BinColor, string> = {
  blue: "Putar animasi tong biru",
  green: "Putar animasi tong hijau",
  gray: "Putar animasi tong abu-abu",
};

const CHIP_COLORS: Record<BinColor, string> = {
  blue: "#2f6fe0",
  green: "#3e9b4f",
  gray: "#8b949c",
};

const CHIP_TEXT: Record<BinColor, string> = {
  blue: "Biru",
  green: "Hijau",
  gray: "Abu-abu",
};

const COLORS: BinColor[] = ["blue", "green", "gray"];

const FORWARD_BY_COLOR: Record<BinColor, VideoId> = {
  blue: "animation-1",
  green: "animation-2",
  gray: "animation-3",
};

const REVERSE_BY_COLOR: Record<BinColor, VideoId> = {
  blue: "animation-1r",
  green: "animation-2r",
  gray: "animation-3r",
};

/**
 * The interactive bin scene. Renders the seven embedded videos with
 * their `blob:` URLs from the isolated media module, mounts the
 * playback controller, and positions the desktop hotspots on the
 * 854 x 480 reference frame (recalculated on resize).
 */
export default function InteractiveScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLVideoElement>(null);
  const videoRefs = useRef<Partial<Record<VideoId, HTMLVideoElement>>>({});
  const controllerRef = useRef<VideoPlayerController | null>(null);
  const [state, setState] = useState<PlaybackState>({ status: "idle" });

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    const background = backgroundRef.current;
    if (!scene || !stage || !background) return;

    const hotspots = [
      ...scene.querySelectorAll<HTMLButtonElement>(".hotspot"),
    ];
    const triggers = [
      ...scene.querySelectorAll<HTMLButtonElement>(".hotspot, .chip"),
    ];

    const sources = createVideoSources(videoPayloads);
    for (const id of VIDEO_IDS) {
      const video =
        id === "background" ? background : videoRefs.current[id];
      if (video) {
        video.src = sources.urls[id];
        video.load();
      }
    }

    const forward = Object.fromEntries(
      COLORS.map((color) => [
        color,
        videoRefs.current[FORWARD_BY_COLOR[color]]!,
      ]),
    ) as Record<BinColor, HTMLVideoElement>;
    const reverse = Object.fromEntries(
      COLORS.map((color) => [
        color,
        videoRefs.current[REVERSE_BY_COLOR[color]]!,
      ]),
    ) as Record<BinColor, HTMLVideoElement>;

    const controller = createVideoPlayerController(
      { scene, background, forward, reverse, triggers },
      matchMedia("(prefers-reduced-motion: reduce)"),
      () => sources.dispose(),
      setState,
    );
    controllerRef.current = controller;

    positionHotspots(stage, hotspots);
    const observer = new ResizeObserver(() => positionHotspots(stage, hotspots));
    observer.observe(stage);

    return () => {
      observer.disconnect();
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const select = (color: BinColor, trigger: HTMLButtonElement) => {
    void controllerRef.current?.selectBin(color, trigger);
  };

  return (
    <div
      ref={sceneRef}
      className="scene"
      id="pilah-scene"
      aria-label="Pilih tong sampah untuk memulai animasi"
    >
      <img className="ambient" alt="" aria-hidden="true" src={posterDataUri} />
      <div className="stage" ref={stageRef}>
        <img
          className="poster"
          src={posterDataUri}
          width={1280}
          height={720}
          alt="Tiga tong sampah: biru di kiri, hijau di tengah, dan abu-abu di kanan"
        />
        <video
          ref={backgroundRef}
          className="layer"
          id="background"
          width={1280}
          height={720}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Animasi utama tiga tong sampah"
        ></video>
        <video
          ref={(el) => {
            if (el) videoRefs.current["animation-1"] = el;
          }}
          className="layer"
          id="animation-1"
          width={1280}
          height={720}
          playsInline
          preload="auto"
          aria-hidden="true"
        ></video>
        <video
          ref={(el) => {
            if (el) videoRefs.current["animation-2"] = el;
          }}
          className="layer"
          id="animation-2"
          width={1280}
          height={720}
          playsInline
          preload="auto"
          aria-hidden="true"
        ></video>
        <video
          ref={(el) => {
            if (el) videoRefs.current["animation-3"] = el;
          }}
          className="layer"
          id="animation-3"
          width={1280}
          height={720}
          playsInline
          preload="auto"
          aria-hidden="true"
        ></video>
        <video
          ref={(el) => {
            if (el) videoRefs.current["animation-1r"] = el;
          }}
          className="layer"
          id="animation-1r"
          width={1280}
          height={720}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        ></video>
        <video
          ref={(el) => {
            if (el) videoRefs.current["animation-2r"] = el;
          }}
          className="layer"
          id="animation-2r"
          width={1280}
          height={720}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        ></video>
        <video
          ref={(el) => {
            if (el) videoRefs.current["animation-3r"] = el;
          }}
          className="layer"
          id="animation-3r"
          width={1280}
          height={720}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        ></video>
        {COLORS.map((color) => (
          <button
            key={color}
            className={`hotspot ${color}`}
            data-video={color === "blue" ? "1" : color === "green" ? "2" : "3"}
            aria-label={HOTSPOT_LABELS[color]}
            onClick={(event) => select(color, event.currentTarget)}
          ></button>
        ))}
      </div>
      <div className="picker">
        <p>Pilih tong sampah</p>
        <div className="chips">
          {COLORS.map((color) => (
            <button
              key={color}
              className="chip"
              data-video={color === "blue" ? "1" : color === "green" ? "2" : "3"}
              type="button"
              aria-label={CHIP_LABELS[color]}
              onClick={(event) => select(color, event.currentTarget)}
            >
              <i style={{ background: CHIP_COLORS[color] }}></i>
              {CHIP_TEXT[color]}
            </button>
          ))}
        </div>
      </div>
      <p id="status" role="status" hidden={state.status !== "error"}>
        {state.status === "error" ? state.message : ""}
      </p>
    </div>
  );
}
