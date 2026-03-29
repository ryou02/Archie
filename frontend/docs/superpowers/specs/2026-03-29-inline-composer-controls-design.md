# Inline Composer Controls Refresh — Design Spec

## Overview

Refine the `/build` chat composer so voice input takes less horizontal space and feels integrated with the input instead of competing with it. The mic control moves inside the text field as an always-visible icon-only capsule with no divider, and the `Send` text button becomes a compact arrow-only action beside the field.

## Goals

- Eliminate the oversized standalone mic pill.
- Keep voice input immediately discoverable without giving it equal weight to primary text entry.
- Preserve fast send access while reducing composer width pressure.
- Maintain the existing glass treatment and align the controls with the current ambient workspace styling.
- Keep the current voice input interaction model intact.

## Non-Goals

- Change voice input behavior from hold-to-talk to another interaction model.
- Rewrite build-page chat state, submission flow, or speech-recognition wiring.
- Redesign the broader chat shell, message list, or avatar stage.

## Layout Architecture

The composer remains a horizontal row with two primary regions:

- **Input shell:** the dominant pill containing the text input and a trailing inline mic capsule.
- **Send action:** a separate compact arrow-only button to the right of the input shell.

This preserves clear action boundaries while removing the current three-equal-pill feel.

## Components

### 1. Composer Structure (`src/components/ChatPanel.tsx`)

Update the composer markup so the input and mic share a single visual container:

- wrap the text input and mic control in an inner input-shell element
- keep the mic always visible at the trailing edge of that shell
- remove the current standalone `Mic` button placement
- replace the `Send` text label with an arrow-only affordance

The underlying handlers stay the same:

- text input still submits on `Enter`
- send button still calls `handleSubmit`
- mic button still uses the existing pointer-down/pointer-up hold-to-talk handlers

### 2. Inline Mic Control (`src/components/ChatPanel.tsx` + CSS)

The mic becomes a compact capsule inside the input shell:

- icon-only in idle state
- no divider or extra label
- visually distinct enough to remain discoverable
- subtle active treatment when recording or connecting, without expanding its footprint

The capsule should feel tactile but restrained, closer to an inset utility control than a primary CTA.

### 3. Send Arrow Control (`src/components/ChatPanel.tsx` + CSS)

The send action becomes a separate compact arrow button:

- icon-only instead of uppercase text
- smaller overall width than the current send pill
- still visually separate from the input shell so submission remains obvious

The send control should stay clearly tappable on touch devices while occupying less width than the current text button.

## Data Flow

No state ownership changes are required:

- `ChatPanel` continues to own local `input` state.
- `handleSubmit` remains the submit path for both the button and `Enter`.
- Existing `micSupported`, `micState`, `onMicStart`, and `onMicStop` wiring remain unchanged.

This is a presentation-layer refactor rather than a behavior refactor.

## Styling Direction

- Keep the current ambient glass palette and rounded composer language.
- Make the input shell the visual anchor of the row.
- Style the inline mic as a small capsule nested within the field rather than a separate neighboring pill.
- Remove any divider treatment between text entry and the mic.
- Style send as a compact arrow button with enough contrast to read as the primary submit action.
- Preserve focus-visible treatment for keyboard navigation.
- Preserve disabled styling for unsupported mic and empty-send states.

## Error Handling And Edge Cases

- When voice input is unavailable, the inline mic remains present but disabled so layout does not shift.
- When recording or connecting, the mic uses state styling only; no label expansion should occur.
- When the input contains long text, the inline mic must not compress the field to the point that typing feels cramped.
- On narrow screens, the composer must remain a single usable row without the trailing controls wrapping awkwardly.
- Empty input should still disable the send action without changing its size or position.

## Testing Strategy

- Update source-based tests that assert composer structure to reflect the nested input-shell layout.
- Add or adjust assertions for the inline mic class usage and arrow-send control markup in `test/build-layout.test.ts` or a chat-panel-focused source test if that is where composer structure is currently covered.
- Verify the existing mic interaction handlers are still bound to pointer events after the markup change.
- Verify disabled and active-state class paths remain represented in source so the UI states still render correctly.
