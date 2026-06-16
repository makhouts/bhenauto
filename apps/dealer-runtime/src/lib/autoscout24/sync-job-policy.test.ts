import test from "node:test";
import assert from "node:assert/strict";
import {
  autoScoutSyncJobDedupeKey,
  desiredAutoScoutPublicationAction,
  supersededAutoScoutActions,
} from "./sync-job-policy";

test("coalesces publication updates into one durable queue key", () => {
  assert.equal(
    autoScoutSyncJobDedupeKey({ carId: "car-1", action: "set-active" }),
    "car:car-1:publication",
  );
  assert.equal(
    autoScoutSyncJobDedupeKey({ carId: "car-1", action: "set-inactive" }),
    "car:car-1:publication",
  );
  assert.equal(
    autoScoutSyncJobDedupeKey({ carId: "car-1", action: "set-publication" }),
    "car:car-1:publication",
  );
});

test("deleting a listing supersedes pending updates", () => {
  assert.deepEqual(
    supersededAutoScoutActions("delete"),
    ["upsert", "set-publication", "set-active", "set-inactive"],
  );
});

test("resolves the current publication state at execution time", () => {
  assert.equal(desiredAutoScoutPublicationAction({ sold: true, reserved: false }), "delete");
  assert.equal(desiredAutoScoutPublicationAction({ sold: false, reserved: true }), "Inactive");
  assert.equal(desiredAutoScoutPublicationAction({ sold: false, reserved: false }), "Active");
});
