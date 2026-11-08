const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const html = readFileSync(new URL("../pilah.html", `file://${__filename}`), "utf8");

function findOpeningTag(tagName, attributes = {}) {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
  return tags.find((tag) =>
    Object.entries(attributes).every(([name, value]) =>
      new RegExp(`\\b${name}=["']${value}["']`).test(tag),
    ),
  );
}

function attributesOf(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
      match[1],
      match[2] ?? match[3],
    ]),
  );
}

function textContent(markup) {
  return markup
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionByClass(className) {
  const start = html.search(new RegExp(`<section\\b(?=[^>]*\\bclass=["'][^"']*\\b${className}\\b)[^>]*>`, "i"));
  if (start < 0) return null;
  const openingEnd = html.indexOf(">", start) + 1;
  const close = html.indexOf("</section>", openingEnd);
  return close < 0 ? null : html.slice(start, close + "</section>".length);
}

test("hero precedes existing scene and CTA targets scene", () => {
  const hero = sectionByClass("hero");
  const scene = findOpeningTag("div", { class: "scene" });

  assert.ok(hero, "hero section exists");
  assert.ok(scene, "scene wrapper exists");
  assert.ok(html.indexOf(hero) < html.indexOf(scene), "hero precedes scene");
  assert.equal(attributesOf(scene).id, "pilah-scene");

  const cta = [...hero.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].find((match) =>
    textContent(match[0]).includes("Mulai pilah"),
  );
  assert.ok(cta, "hero includes the Mulai pilah link");
  assert.equal(attributesOf(cta[0].match(/<a\b[^>]*>/i)[0]).href, "#pilah-scene");
});

test("hero uses the supplied color categories", () => {
  const hero = sectionByClass("hero");
  assert.ok(hero, "hero section exists");
  const copy = textContent(hero).toLowerCase();
  assert.match(copy, /hijau[^.]*organik/);
  assert.match(copy, /biru[^.]*kertas/);
  assert.match(copy, /abu-abu[^.]*residu/);
});

test("preserves animated video element IDs", () => {
  const videoIds = [...html.matchAll(/<video\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1],
  );
  for (const id of [
    "background",
    "animation-1",
    "animation-2",
    "animation-3",
    "animation-1r",
    "animation-2r",
    "animation-3r",
  ]) {
    assert.ok(videoIds.includes(id), `video #${id} remains in the page`);
  }
});

test("preserves hotspot animation keys", () => {
  const buttons = [...html.matchAll(/<button\b[^>]*>/gi)].map((match) => ({
    tag: match[0],
    attrs: attributesOf(match[0]),
  }));
  for (const [color, video] of [
    ["blue", "1"],
    ["green", "2"],
    ["gray", "3"],
  ]) {
    assert.ok(
      buttons.some(
        ({ tag, attrs }) =>
          attrs["data-video"] === video && new RegExp(`\\b${color}\\b`, "i").test(tag),
      ),
      `${color} hotspot still selects animation ${video}`,
    );
  }
});
