import { VIDEO_IDS, type VideoId } from "./embeddedMedia";

export interface VideoSources {
  urls: Readonly<Record<VideoId, string>>;
  dispose(): void;
}

/**
 * Decodes a base64 MP4 payload into raw bytes, matching the legacy
 * page's `atob` + `Uint8Array` behavior exactly.
 */
export function decodeMp4Payload(payload: string): Uint8Array<ArrayBuffer> {
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Creates one `video/mp4` Blob URL per payload and revokes them all on
 * disposal, matching the legacy page's `blobUrl` behavior.
 */
export function createVideoSources(
  payloads: Readonly<Record<VideoId, string>>,
): VideoSources {
  const urls = {} as Record<VideoId, string>;
  for (const id of VIDEO_IDS) {
    const blob = new Blob([decodeMp4Payload(payloads[id])], {
      type: "video/mp4",
    });
    urls[id] = URL.createObjectURL(blob);
  }
  return {
    urls,
    dispose() {
      for (const id of VIDEO_IDS) URL.revokeObjectURL(urls[id]);
    },
  };
}
