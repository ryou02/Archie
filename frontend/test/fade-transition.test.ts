import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const globalsCss = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf8"
);
const landingPage = readFileSync(
  path.join(process.cwd(), "src/app/page.tsx"),
  "utf8"
);
const buildPage = readFileSync(
  path.join(process.cwd(), "src/app/build/page.tsx"),
  "utf8"
);

test("landing page fades out content before routing to build", () => {
  assert.match(landingPage, /const LANDING_FADE_MS = 280;/);
  assert.match(landingPage, /const BUILD_ROUTE = "\/build";/);
  assert.match(landingPage, /const \[isLeaving, setIsLeaving\] = useState\(false\);/);
  assert.match(landingPage, /if \(isLeaving\) \{\s*return;\s*\}/s);
  assert.match(
    landingPage,
    /setIsLeaving\(true\);\s*leaveTimerRef\.current = setTimeout\(\(\) => \{\s*router\.push\(BUILD_ROUTE\);\s*\}, LANDING_FADE_MS\);/s
  );
  assert.match(
    landingPage,
    /className=\{`landing-page[\s\S]*\$\{\s*isLeaving \? " landing-page--leaving" : ""\s*\}/s
  );
});

test("landing CSS fades and blurs the hero content during exit", () => {
  assert.match(globalsCss, /\.landing-page--leaving \.landing-shell\s*\{[^}]*opacity:\s*0;[^}]*filter:\s*blur\(18px\);/s);
  assert.match(globalsCss, /\.landing-page--leaving \.hero-mark\s*\{[^}]*filter:\s*blur\(16px\);/s);
  assert.match(globalsCss, /\.landing-page--leaving \.hero-copy-wrap\s*\{[^}]*filter:\s*blur\(20px\);/s);
  assert.match(
    globalsCss,
    /\.landing-page--leaving \.ambient-video--landing\s*\{[^}]*filter:\s*blur\(12px\);[^}]*transform:\s*scale\(1\.06\);/s
  );
  assert.match(globalsCss, /\.landing-page--leaving \.btn-primary\s*\{[^}]*opacity:\s*0;/s);
});

test("build page mounts with a temporary entering state for blur release", () => {
  assert.match(buildPage, /const BUILD_REVEAL_MS = 480;/);
  assert.match(buildPage, /const \[isEntering, setIsEntering\] = useState\(true\);/);
  assert.match(
    buildPage,
    /if \(window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches\) \{\s*setIsEntering\(false\);\s*return;\s*\}/s
  );
  assert.match(
    buildPage,
    /const enterTimer = setTimeout\(\(\) => \{\s*setIsEntering\(false\);\s*\}, BUILD_REVEAL_MS\);/s
  );
  assert.match(buildPage, /build-page--entering/);
  assert.match(buildPage, /workspace-avatar--entering/);
  assert.match(buildPage, /workspace-chat--entering/);
});

test("build CSS unblurs the background while avatar and chat reveal together", () => {
  assert.match(
    globalsCss,
    /\.build-page--entering \.ambient-video--build\s*\{[^}]*filter:\s*blur\(13px\);[^}]*transform:\s*scale\(1\.08\);[^}]*opacity:\s*0\.92;/s
  );
  assert.match(
    globalsCss,
    /\.workspace-avatar--entering,\s*\.workspace-chat--entering\s*\{[^}]*opacity:\s*0;[^}]*transform:\s*translateY\(1\.5rem\);[^}]*filter:\s*blur\(18px\);/s
  );
});

test("reduced motion disables the new landing and build transition effects", () => {
  assert.match(
    globalsCss,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*\.landing-shell,[\s\S]*\.ambient-video--landing,[\s\S]*\.workspace-chat\s*\{[\s\S]*transition:\s*none;/s
  );
  assert.match(
    globalsCss,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*\.landing-page--leaving \.landing-shell,[\s\S]*\.workspace-chat--entering\s*\{[\s\S]*opacity:\s*1;[\s\S]*transform:\s*none;[\s\S]*filter:\s*none;/s
  );
});
