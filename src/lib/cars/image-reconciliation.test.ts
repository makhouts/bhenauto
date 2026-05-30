import test from "node:test";
import assert from "node:assert/strict";
import { reconcileCarImages } from "./image-reconciliation";

test("preserves existing image rows and only updates their order", () => {
  const result = reconcileCarImages([
    { id: "image-1", url: "cars/one.webp", sortOrder: 0 },
    { id: "image-2", url: "cars/two.webp", sortOrder: 1 },
  ], [
    "cars/two.webp",
    "cars/one.webp",
  ]);

  assert.deepEqual(result.updates, [
    { id: "image-2", sortOrder: 0 },
    { id: "image-1", sortOrder: 1 },
  ]);
  assert.deepEqual(result.creates, []);
  assert.deepEqual(result.deleteIds, []);
  assert.deepEqual(result.removedUrls, []);
});

test("returns only genuinely removed URLs for R2 cleanup", () => {
  const result = reconcileCarImages([
    { id: "image-1", url: "cars/keep.webp", sortOrder: 0 },
    { id: "image-2", url: "cars/remove.webp", sortOrder: 1 },
  ], [
    "cars/keep.webp",
    "cars/new.webp",
  ]);

  assert.deepEqual(result.creates, [{ url: "cars/new.webp", sortOrder: 1 }]);
  assert.deepEqual(result.deleteIds, ["image-2"]);
  assert.deepEqual(result.removedUrls, ["cars/remove.webp"]);
});
