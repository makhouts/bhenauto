import assert from "node:assert/strict";
import test from "node:test";
import { diffImportedImages, type ImportedImage } from "./image-diff";

const photo = (url: string, sortOrder = 0): ImportedImage => ({ url, sortOrder, sourceUrl: `https://images.example/${url}`, autoscoutImageId: url, sourceMd5: "hash" });

test("unchanged photos need no nested image writes on a listing update", () => {
  const images = [photo("first"), photo("second", 1)];
  assert.equal(diffImportedImages(images.map((image, i) => ({ ...image, id: String(i) })), images), undefined);
});
test("reordering preserves IDs and updates only order", () => {
  const result = diffImportedImages([{ ...photo("a"), id: "a-id" }, { ...photo("b", 1), id: "b-id" }], [photo("b"), photo("a", 1)]);
  assert.deepEqual(result, { update: [{ where: { id: "b-id" }, data: photo("b") }, { where: { id: "a-id" }, data: photo("a", 1) }] });
});
test("a replacement deletes only the removed photo and creates only the new one", () => {
  const result = diffImportedImages([{ ...photo("a"), id: "keep" }, { ...photo("b", 1), id: "remove" }], [photo("a"), photo("c", 1)]);
  assert.deepEqual(result, { create: [photo("c", 1)], deleteMany: { id: { in: ["remove"] } } });
});
test("metadata changes update the existing image record", () => {
  const image = { ...photo("a"), sourceMd5: "new-hash", sourceUrl: "https://images.example/new" };
  assert.deepEqual(diffImportedImages([{ ...photo("a"), id: "keep" }], [image]), { update: [{ where: { id: "keep" }, data: image }] });
});
test("duplicate URLs match distinct rows and an empty gallery removes all rows", () => {
  const existing = [{ ...photo("a"), id: "one" }, { ...photo("a", 1), id: "two" }];
  assert.equal(diffImportedImages(existing, [photo("a"), photo("a", 1)]), undefined);
  assert.deepEqual(diffImportedImages(existing, [photo("a")]), { deleteMany: { id: { in: ["two"] } } });
  assert.deepEqual(diffImportedImages(existing, []), { deleteMany: { id: { in: ["one", "two"] } } });
});
