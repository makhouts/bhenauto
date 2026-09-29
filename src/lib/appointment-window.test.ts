import assert from "node:assert/strict";
import test from "node:test";
import { parseISO } from "date-fns";
import { appointmentWindowSchema, calendarDateWhere, calendarMonth, calendarWeek, canonicalRanges } from "./appointment-window";

test("calendar windows cover month/year boundaries without loading all history", () => {
  assert.deepEqual(calendarWeek(parseISO("2027-01-01")), { start: "2026-12-28", end: "2027-01-04" });
  assert.deepEqual(calendarMonth(parseISO("2028-02-10")), { start: "2028-02-01", end: "2028-03-01" });
  const current = calendarMonth(parseISO("2026-09-29"));
  const future = calendarMonth(parseISO("2029-06-12"));
  assert.deepEqual(canonicalRanges([future, current, current, { start: "2026-09-05", end: "2026-09-06" }]), [current, future]);
  assert.equal(calendarDateWhere([current, future]).length, 2);
});
test("Brussels calendar boundaries follow daylight saving time", () => {
  const spring = calendarDateWhere([{ start: "2026-03-29", end: "2026-03-30" }])[0].date;
  assert.equal(spring.gte.toISOString(), "2026-03-28T23:00:00.000Z");
  assert.equal(spring.lt.getTime() - spring.gte.getTime(), 23 * 3_600_000);
  const autumn = calendarDateWhere([{ start: "2026-10-25", end: "2026-10-26" }])[0].date;
  assert.equal(autumn.lt.getTime() - autumn.gte.getTime(), 25 * 3_600_000);
});
test("calendar requests reject unbounded, reversed and invalid dates", () => {
  for (const range of [{ start: "2026-01-01", end: "2027-01-01" }, { start: "2026-09-29", end: "2026-09-28" }, { start: "2026-02-30", end: "2026-03-01" }]) {
    assert.equal(appointmentWindowSchema.safeParse({ ranges: [range], pendingPage: 1 }).success, false);
  }
  assert.equal(appointmentWindowSchema.safeParse({ ranges: Array(9).fill({ start: "2026-09-01", end: "2026-10-01" }), pendingPage: 1 }).success, false);
});
