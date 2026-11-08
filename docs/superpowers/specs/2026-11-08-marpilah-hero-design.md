# MARPILAH Hero Above Interactive Bins

## Intent

Give children and teenagers a clear introduction to sorting waste by bin color, then lead them into the existing MARPILAH bin animation.

## Goals

- Add a distinct hero section before the existing interactive scene.
- Explain the supplied categories: green for organic waste, blue for paper, and gray for residual waste.
- Provide one clear action that takes the visitor to the existing bin experience.
- Preserve the existing MARPILAH title and brand text.

## Non-goals

- Change, replace, re-encode, or reposition any video, poster, hotspot, animation timing, or event handler.
- Redesign the existing navbar.
- Build the Kamus Sampah or Bank Sampah pages, or add a sorting quiz.

## Constraints

- Keep all existing video elements, IDs, sources, hotspot buttons, data attributes, scripts, and animation behavior intact.
- Keep the existing scene as a self-contained component below the hero; only add an anchor target if needed by the hero action.
- Make the page flow vertically so the hero precedes the existing full-screen scene, while retaining the scene's current sizing and responsive behavior.
- Preserve the existing user edits to the page title and MARPILAH brand.

## Approaches

1. **Hero in normal page flow, existing scene below (chosen):** adds a short introduction and a “Mulai pilah” link above the current scene. This keeps the animation unobstructed and changes only the page layout around it.
2. **Hero layered over the scene:** saves vertical space but risks covering the video or its clickable hotspots, contrary to the preservation requirement.
3. **Redesign the navbar or replace the scene:** expands scope and risks changing existing behavior without helping the requested introduction.

## Design

Use a warm, high-contrast hero with the heading “Setiap warna punya tujuan.”, a concise explanation of the three supplied color categories, and one primary “Mulai pilah” action that scrolls to the existing animation. Leave the current navbar and animation component visually and behaviorally unchanged.

## Builder calls

- Interpret “hero di atas video” as a separate section before the scene, not text overlaid on the video.
- Keep the current navbar as-is; it is not required for this change.
- Treat the color/category mapping as user-provided copy, without adding unsupported waste categories.
