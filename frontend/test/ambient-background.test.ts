import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AMBIENT_BACKGROUND_VIDEO_SRC,
  getAmbientBackgroundConfig,
} from "../src/lib/ambient-background";
import AmbientBackground from "../src/components/AmbientBackground";

test("landing config enables video and uses hero readability overlays", () => {
  const config = getAmbientBackgroundConfig("landing");

  assert.equal(config.surface, "landing");
  assert.equal(config.enableVideo, true);
  assert.equal(config.videoSrc, AMBIENT_BACKGROUND_VIDEO_SRC);
  assert.equal(config.videoClassName, "ambient-video ambient-video--landing");
  assert.match(config.containerClassName, /ambient-bg--landing/);
});

test("build config enables video and uses denser chrome readability overlays", () => {
  const config = getAmbientBackgroundConfig("build");

  assert.equal(config.surface, "build");
  assert.equal(config.enableVideo, true);
  assert.equal(config.videoSrc, AMBIENT_BACKGROUND_VIDEO_SRC);
  assert.equal(config.videoClassName, "ambient-video ambient-video--build");
  assert.match(config.containerClassName, /ambient-bg--build/);
});

test("ambient background renders only the surface-specific blurred video", () => {
  const html = renderToStaticMarkup(
    React.createElement(AmbientBackground, { surface: "landing" })
  );

  assert.match(html, /ambient-bg--landing/);
  assert.doesNotMatch(html, /ambient-video ambient-video--landing/);
  assert.doesNotMatch(html, /src="\/media\/archie-ambient-loop\.mp4"/);
  assert.doesNotMatch(html, /ambient-fallback/);
  assert.doesNotMatch(html, /ambient-grain/);
  assert.doesNotMatch(html, /ambient-drift/);
  assert.doesNotMatch(html, /ambient-overlay/);
});

test("ambient background defers video rendering until after client mount", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/AmbientBackground.tsx"),
    "utf8"
  );

  assert.match(source, /"use client";/);
  assert.match(source, /const isMounted = useSyncExternalStore\(/);
  assert.match(source, /\(\) => true,\s*\(\) => false/s);
  assert.match(source, /config\.enableVideo && isMounted \?/);
});
