import test from "node:test";
import assert from "node:assert/strict";
import { AUTOSCOUT_SOURCE_OF_TRUTH, isAutoScoutSourceOfTruth } from "./source-of-truth";

test("detects autoscout-managed source of truth values", () => {
  assert.equal(isAutoScoutSourceOfTruth(AUTOSCOUT_SOURCE_OF_TRUTH), true);
  assert.equal(isAutoScoutSourceOfTruth("website"), false);
  assert.equal(isAutoScoutSourceOfTruth(null), false);
});
