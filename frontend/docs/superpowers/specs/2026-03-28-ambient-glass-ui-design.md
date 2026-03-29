# Ambient Glass UI Design

**Date:** 2026-03-28
**Status:** Approved in terminal brainstorming, pending written-spec review

## Goal

Redesign both the landing page and `/build` experience around a shared ambient background system and a more transparent liquid-glass chat treatment. The result should feel premium and restrained: blurry/static, subtly animated, and dimensional without obvious glow effects or theme gimmicks.

## User Intent

The user wants:

- a dynamic or animated background that feels blurry and slightly static-textured
- motion that stays subtle, with slow lateral drift rather than pulsing or attention-seeking animation
- a liquid-glass chat panel
- stronger 3D edge definition on the glass
- more transparency in the glass body
- no glowing ambience bleeding outward from the glass edges
- the redesign applied to both the landing page and the `/build` page
- support for both video and CSS-driven effects at the same time, not one or the other

The underwater example was explicitly non-binding. The target is ambient premium motion, not an underwater theme.

## Visual Direction

### Background

The background language is a hybrid stack composed of:

- a low-contrast looping video layer as the organic motion base
- procedural CSS haze and blur layers above the video
- a soft grain or static texture layer
- page-specific contrast masks and vignettes to protect readability

The motion should stay quiet. The main readable motion cue is slow side-to-side drift in the procedural layers, while the video contributes additional ambient life. No flashing, pulsing, or dramatic parallax.

### Glass

The chat treatment should move toward a transparent refractive shell:

- clearer body transparency than the current panel
- crisp dimensional edges, likely via inner highlight rims and beveled edge separation
- no visible outer glow or light spill emanating from the panel boundary
- subtle specular behavior kept inside the panel silhouette
- message bubbles and controls quieter than the shell so the panel reads as a single object

This should feel closer to a transparent lens than a frosted card.

## Surface-by-Surface Design

### Landing Page

The landing page should inherit the new ambient background system and shift away from the current aurora-dominant treatment. The hero content can remain structurally simple, but the background, logo container, and CTA should be tuned to sit comfortably in the new visual language.

Expected changes:

- replace or significantly reduce the current aurora/streak/star look
- use the shared ambient background stack
- preserve strong title readability over a softer, more cinematic field
- update hero chrome to match the new glass/material system where appropriate

### Build Page

The `/build` page is the primary beneficiary of the redesign.

Expected changes:

- use the same ambient background system as the landing page
- convert the main chat shell to the new transparent refractive glass treatment
- tune the header, task panel, and related UI chrome so they no longer feel like a separate hard-edged game UI system
- preserve message readability, focus states, and control clarity despite the more transparent container

## Architecture

The redesign should be implemented as a shared visual system rather than page-local effects.

### Shared Units

Create focused shared units for:

- ambient background rendering
- optional video layer handling
- glass material tokens/utilities
- page-level overlay masks and readability layers

The likely structure is:

- a reusable background component shared by both pages
- CSS variables and utility classes in global styles for background and glass primitives
- minimal page-specific composition in each route component

This keeps the visual system reusable and prevents long inline-style blocks from growing further inside page files.

## File-Level Intent

The likely files touched are:

- `src/app/page.tsx`
  - apply the new shared background system to the landing page and simplify current one-off background layers
- `src/app/build/page.tsx`
  - replace existing background composition and adapt surrounding UI chrome to the new material system
- `src/components/ChatPanel.tsx`
  - move the chat shell, input row, bubbles, and controls toward the transparent refractive glass treatment
- `src/app/globals.css`
  - define shared background layers, motion keyframes, grain/static treatment, glass tokens, and reduced-motion behavior

Potential new files:

- `src/components/AmbientBackground.tsx`
  - shared background layer composition for both pages
- `public/...`
  - background video asset if the final implementation uses a checked-in loop instead of a remote/static path managed elsewhere

## Motion and Accessibility

The motion system needs a reduced-motion path.

Requirements:

- preserve the visual identity when animation is reduced or disabled
- let the background remain attractive without relying on continuous motion
- avoid any effect that reduces legibility or causes attention drag

The glass and overlays must maintain sufficient text contrast at rest and while the video is moving beneath them.

## Error Handling and Resilience

The background must degrade gracefully.

If the video is unavailable, blocked, slow to load, or removed, the CSS-generated background layers should still form a complete visual result. The UI should never depend on the video to remain legible or aesthetically coherent.

If backdrop filters or higher-cost effects perform poorly on a given environment, the design should still hold with a flatter fallback.

## Testing and Validation

Validation should follow the requested Playwright-interactive workflow principles as closely as this environment allows.

Planned QA coverage:

- desktop visual pass on landing page
- desktop visual pass on `/build`
- mobile visual pass on landing page
- mobile visual pass on `/build`
- functional check that chat input, send, mic controls, and task chrome remain usable after styling changes
- reduced-motion check
- fallback check with video absent or disabled

Important constraint:

The requested `playwright-interactive` skill depends on `js_repl`, which is not exposed in this Codex harness. The implementation should still be validated using the same structure: explicit QA inventory, separate functional and visual passes, reproducible viewport checks, and captured evidence where practical.

## Non-Goals

This redesign should not:

- turn the product into an underwater-themed interface
- introduce aggressive cinematic motion
- rely on glowing edge ambience around glass panels
- replace usability with visual experimentation
- force all existing components into a totally new layout unless needed to support the material system

## Open Implementation Choices

These decisions are intentionally deferred to planning and implementation:

- exact video asset path and format
- whether the video is checked into `public/` or supplied externally
- whether auxiliary chrome beyond the chat shell gets the same glass depth treatment or a quieter variant
- how much of the current `game-panel` styling is removed versus repurposed

## Recommended Implementation Direction

Implement a shared hybrid ambient background system that stacks muted video and procedural CSS effects together on both pages. Use a transparent refractive chat shell with stronger dimensional edges, but keep all highlight behavior constrained to the panel boundary so the result feels crisp rather than glowy.
