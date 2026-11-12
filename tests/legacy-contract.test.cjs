"use strict";

/**
 * Characterization suite for the embedded media payload strings.
 *
 * The legacy single-file page's structural contract (video IDs in the
 * DOM, hotspot/chip mappings, the blobUrl decoder, hero structure) was
 * retired at the Task 5 cutover; its coverage now lives in the React
 * app tests (tests/App.test.tsx and tests/scene/InteractiveScene.test.tsx).
 * What stays here is the media fingerprint freeze: the exact SHA-256
 * of every embedded base64 payload, its decoded byte sequence, and the
 * poster data URI, asserted against the extracted
 * `src/media/inline/*.txt` files so the strings can never silently
 * change or become external URLs.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const repoRoot = path.resolve(__dirname, "..");
const fixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures", "inline-media-sha256.json"), "utf8"),
);

const VIDEO_IDS = [
  "background",
  "animation-1",
  "animation-2",
  "animation-3",
  "animation-1r",
  "animation-2r",
  "animation-3r",
];

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * The payloads live verbatim in `src/media/inline/*.txt` (the legacy
 * VID strings and poster data URI, minus the text-file line ending).
 */
function payloadStrings() {
  const payloads = {};
  for (const id of VIDEO_IDS) {
    const raw = fs.readFileSync(
      path.join(repoRoot, "src", "media", "inline", `${id}.txt`),
      "utf8",
    );
    payloads[id] = raw.replace(/\r?\n$/, "");
  }
  return payloads;
}

function posterDataUri() {
  const raw = fs.readFileSync(
    path.join(repoRoot, "src", "media", "inline", "poster.txt"),
    "utf8",
  );
  return raw.replace(/\r?\n$/, "");
}

test("embedded payload fingerprints match", () => {
  const payloads = payloadStrings();
  const poster = posterDataUri();
  for (const id of VIDEO_IDS) {
    assert.equal(sha256(payloads[id]), fixture.base64[id], `base64 fingerprint of ${id}`);
    const decoded = Buffer.from(payloads[id], "base64");
    assert.equal(
      crypto.createHash("sha256").update(decoded).digest("hex"),
      fixture.decodedBytes[id],
      `decoded-byte fingerprint of ${id}`,
    );
  }
  assert.equal(sha256(poster), fixture.poster, "poster data URI fingerprint");
});
