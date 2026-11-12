import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  posterDataUri,
  videoPayloads,
} from "../../src/media/embeddedMedia";
import {
  createVideoSources,
  decodeMp4Payload,
} from "../../src/media/videoSources";
import type { VideoId } from "../../src/media/embeddedMedia";
import fixture from "../fixtures/inline-media-sha256.json";

const VIDEO_IDS: VideoId[] = [
  "background",
  "animation-1",
  "animation-2",
  "animation-3",
  "animation-1r",
  "animation-2r",
  "animation-3r",
];

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("embedded media", () => {
  it("embedded payloads preserve all legacy SHA-256 fingerprints", () => {
    for (const id of VIDEO_IDS) {
      expect(sha256(videoPayloads[id]), `base64 fingerprint of ${id}`).toBe(
        fixture.base64[id],
      );
    }
    expect(sha256(posterDataUri)).toBe(fixture.poster);
  });

  it("decoded payload bytes preserve all legacy SHA-256 fingerprints", () => {
    for (const id of VIDEO_IDS) {
      const decoded = decodeMp4Payload(videoPayloads[id]);
      expect(sha256(decoded), `decoded-byte fingerprint of ${id}`).toBe(
        fixture.decodedBytes[id],
      );
    }
  });

  it("createVideoSources creates seven video/mp4 Blob URLs", () => {
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation((obj: Blob | MediaSource) => {
        const blob = obj as Blob;
        return `blob:mock-${blob.type}-${createObjectURL.mock.calls.length}`;
      });
    const sources = createVideoSources(videoPayloads);

    expect(createObjectURL).toHaveBeenCalledTimes(VIDEO_IDS.length);
    for (const [index, id] of VIDEO_IDS.entries()) {
      const arg = createObjectURL.mock.calls[index][0] as Blob;
      expect(arg.type, `Blob MIME type for ${id}`).toBe("video/mp4");
      expect(sources.urls[id]).toBe(`blob:mock-video/mp4-${index + 1}`);
    }
  });

  it("dispose revokes every generated Blob URL", () => {
    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      return `blob:mock-${Math.random()}`;
    });
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const sources = createVideoSources(videoPayloads);

    expect(revokeObjectURL).not.toHaveBeenCalled();
    sources.dispose();

    expect(revokeObjectURL).toHaveBeenCalledTimes(VIDEO_IDS.length);
    for (const id of VIDEO_IDS) {
      expect(revokeObjectURL).toHaveBeenCalledWith(sources.urls[id]);
    }
  });
});
