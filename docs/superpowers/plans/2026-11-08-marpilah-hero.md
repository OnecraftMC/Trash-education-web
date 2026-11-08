# MARPILAH Hero Above Interactive Bins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an introductory hero above the current MARPILAH bin scene without changing its videos, hotspots, navbar, or animation behavior.

**Architecture:** Keep the existing `.scene` as the interactive experience and place a new hero section before it in normal document flow. Change only the outer page layout and add an anchor target for the hero action; leave the scene's videos, hotspots, and scripts intact.

**Tech Stack:** Existing single-file HTML/CSS/JavaScript; Node.js built-in test runner for a small markup contract test.

**Spec:** `docs/superpowers/specs/2026-11-08-marpilah-hero-design.md`

## Global Constraints

- Keep all existing video elements, IDs, sources, hotspot buttons, data attributes, scripts, and animation behavior intact.
- Keep the existing scene as a self-contained component below the hero; only add an anchor target if needed by the hero action.
- Make the page flow vertically so the hero precedes the existing full-screen scene, while retaining the scene's current sizing and responsive behavior.
- Preserve the existing user edits to the page title and MARPILAH brand.
- Use only the user-supplied mapping: green for organic waste, blue for paper, and gray for residual waste.
- Do not add dependencies.

## Review Focus

- **Missing or misplaced hero:** The hero must precede the scene and its primary action must target the scene. Test: `hero precedes existing scene and CTA targets scene`.
- **Incorrect color/category copy:** The hero must describe green as organic, blue as paper, and gray as residual. Test: `hero uses the supplied color categories`.
- **Missing interactive video layer:** All seven current video IDs must remain. Test: `preserves animated video element IDs`.
- **Broken bin-to-animation mapping:** Hotspot `data-video` values 1, 2, and 3 must remain. Test: `preserves hotspot animation keys`.
- **Viewport overflow or changed scene sizing:** The hero and CTA must remain usable at 390px, and the scene must remain full-height at 1440px. Test: shoot and inspect both widths; review the diff to confirm scene internals and script are untouched.

---

### Task 1: Add a non-invasive MARPILAH hero

**Files:**
- Create: `tests/pilah-hero.test.cjs`
- Modify: `pilah.html`

**Interfaces:**
- Consumes: the existing `<main>` and `.scene` in `pilah.html`.
- Produces: a `section.hero` before `.scene`, a `#pilah-scene` target on the scene wrapper, and a hero link with `href="#pilah-scene"`.

- [ ] **Step 1: Write the failing markup contract tests**

Add Node built-in tests named:

1. `hero precedes existing scene and CTA targets scene`: assert the hero section occurs before `.scene`, the scene has `id="pilah-scene"`, and the hero's “Mulai pilah” link points to `#pilah-scene`.
2. `hero uses the supplied color categories`: assert hero copy maps green to organic, blue to paper, and gray to residual waste.
3. `preserves animated video element IDs`: assert the page still contains `background`, `animation-1`, `animation-2`, `animation-3`, `animation-1r`, `animation-2r`, and `animation-3r`.
4. `preserves hotspot animation keys`: assert the blue, green, and gray hotspot buttons still use `data-video="1"`, `"2"`, and `"3"` respectively.

- [ ] **Step 2: Run the tests and confirm the new hero contract fails**

Run: `node --test tests/pilah-hero.test.cjs`
Expected: the hero-order, anchor, and category-copy assertions fail; existing video and hotspot assertions pass.

- [ ] **Step 3: Add the hero and vertical page flow in `pilah.html`**

Add the heading “Setiap warna punya tujuan.”, a concise sentence describing the three supplied color categories, and one “Mulai pilah” action. Place this section before `.scene`; give the existing `.scene` the `pilah-scene` anchor ID without changing its children. Adjust only outer `main` layout and add hero styles so the page scrolls vertically while `.scene` retains its existing full-screen and responsive behavior. Do not edit the navbar, video markup or sources, hotspot markup, or script.

- [ ] **Step 4: Run regression and visual checks**

Run: `node --test tests/pilah-hero.test.cjs`
Expected: all four tests pass.

Run:

```bash
node /home/hapies/.agents/skills/design-taste-frontend/scripts/shoot.mjs --url pilah.html --w 1440 --out /tmp/pilah-hero-1440.png
node /home/hapies/.agents/skills/design-taste-frontend/scripts/shoot.mjs --url pilah.html --w 390 --out /tmp/pilah-hero-390.png
```

Expected: both screenshots show a readable hero above the scene, with no overflow or clipping. Review `git diff -- pilah.html` to confirm the existing scene's children, video sources, and script are unchanged.

- [ ] **Step 5: Commit the focused change**

```bash
git add pilah.html tests/pilah-hero.test.cjs docs/superpowers/specs/2026-11-08-marpilah-hero-design.md docs/superpowers/plans/2026-11-08-marpilah-hero.md
git commit -m "feat: add MARPILAH intro hero" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
