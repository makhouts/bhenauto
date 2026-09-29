import assert from "node:assert/strict";
import test from "node:test";
import { contactQuery, pageNumber, pageWindow } from "./admin-list-query";

test("pagination bounds malformed input and clamps a page after deletion", () => {
  for (const value of [undefined, "-1", "1.5", "Infinity", "nope", ["2", "3"]]) assert.equal(pageNumber(value), 1);
  assert.equal(pageNumber("999999999"), 1_000_000);
  assert.deepEqual(pageWindow(3, 50), { page: 2, pages: 2, skip: 25, take: 25 });
  assert.deepEqual(pageWindow(8, 0), { page: 1, pages: 1, skip: 0, take: 25 });
});
test("contact search is combined with the selected status in the database", () => {
  const result = contactQuery({ q: "  Audi  ", tab: "behandeld", page: "2" });
  assert.equal(result.query, "Audi");
  assert.equal(result.where.read, true);
  assert.equal(result.where.OR?.length, 5);
  assert.equal(result.requestedPage, 2);
  assert.equal(contactQuery({ tab: "alle" }).where.read, undefined);
  assert.equal(contactQuery({ q: "x".repeat(500), tab: "invalid" }).query.length, 120);
  assert.equal(contactQuery({ tab: "invalid" }).where.read, false);
});
