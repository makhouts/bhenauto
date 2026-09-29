import assert from "node:assert/strict";
import { test } from "node:test";
import { getInventoryWindow } from "./inventory-window";

function originalOrdering(available: string[], sold: string[]) {
  const result: string[] = [];
  while (available.length || sold.length) {
    result.push(...available.splice(0, 3), ...sold.splice(0, 1));
  }
  return result;
}

test("bounded page windows preserve ordering without skips or repeats when either group runs out", () => {
  for (let a = 0; a <= 40; a++) {
    for (let s = 0; s <= 40; s++) {
      const available = Array.from({ length: a }, (_, i) => `available-${i}`);
      const sold = Array.from({ length: s }, (_, i) => `sold-${i}`);
      const expected = originalOrdering([...available], [...sold]);
      for (const size of [1, 3, 4, 9, 24]) {
        const pages: string[] = [];
        for (let offset = 0; offset <= a + s + size; offset += size) {
          const window = getInventoryWindow(a, s, offset, size);
          const availablePage = available.slice(window.available.skip, window.available.skip + window.available.take);
          const soldPage = sold.slice(window.sold.skip, window.sold.skip + window.sold.take);
          const page = window.order.map((isSold) => isSold ? soldPage.shift() : availablePage.shift());
          assert.deepEqual(page, expected.slice(offset, offset + size));
          assert.ok(window.available.take + window.sold.take <= size);
          assert.equal(window.total, expected.length);
          assert.equal(window.hasMore, offset + size < expected.length);
          pages.push(...page as string[]);
        }
        assert.deepEqual(pages, expected);
        assert.equal(new Set(pages).size, a + s);
      }
    }
  }
});

test("deep pages still fetch only nine cars, not every preceding page", () => {
  const window = getInventoryWindow(100000, 100000, 45000, 9);
  assert.equal(window.available.take + window.sold.take, 9);
  assert.equal(window.available.skip + window.sold.skip, 45000);
  assert.equal(window.order.length, 9);
});
