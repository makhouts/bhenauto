import test from "node:test";
import assert from "node:assert/strict";
import { hashAutoScoutPayload } from "./payload-hash";

test("hashes AutoScout payloads independent of object key order", () => {
  const first = hashAutoScoutPayload({
    publication: { status: "Active", channels: [{ id: "AS24" }] },
    make: 13,
    prices: { public: { price: 10000, currency: "EUR" } },
  });

  const second = hashAutoScoutPayload({
    prices: { public: { currency: "EUR", price: 10000 } },
    make: 13,
    publication: { channels: [{ id: "AS24" }], status: "Active" },
  });

  assert.equal(first, second);
});
