import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const layoutSource = readFileSync(
  path.join(process.cwd(), "src/app/layout.tsx"),
  "utf8"
);

test("root layout suppresses html hydration mismatches caused by client-side html mutations", () => {
  assert.match(layoutSource, /<html[\s\S]*suppressHydrationWarning/);
});
