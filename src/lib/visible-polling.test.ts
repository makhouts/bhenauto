import assert from "node:assert/strict";
import { test } from "node:test";
import { startVisiblePolling } from "./visible-polling";

class Visibility extends EventTarget {
  hidden = false;
  change(hidden: boolean) {
    this.hidden = hidden;
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test("hidden pages do not poll; returning to the tab refreshes immediately", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  const visibility = new Visibility();
  Object.defineProperty(globalThis, "document", { configurable: true, value: visibility });
  let calls = 0;
  visibility.hidden = true;
  const poller = startVisiblePolling(async () => { calls++; return 3000; });
  context.after(() => {
    poller.stop();
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  });
  context.mock.timers.tick(60_000);
  await flush();
  assert.equal(calls, 0);
  visibility.change(false);
  context.mock.timers.tick(0);
  await flush();
  assert.equal(calls, 1);
  visibility.change(true);
  context.mock.timers.tick(60_000);
  await flush();
  assert.equal(calls, 1);
  visibility.change(false);
  context.mock.timers.tick(0);
  await flush();
  assert.equal(calls, 2);
  poller.stop();
  visibility.change(false);
  context.mock.timers.tick(60_000);
  assert.equal(calls, 2);
});

test("polls never overlap; hidden in-flight requests are aborted and cannot reschedule", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  const visibility = new Visibility();
  Object.defineProperty(globalThis, "document", { configurable: true, value: visibility });
  const requests: Array<{ signal: AbortSignal; resolve: (delay: number | null) => void }> = [];
  const poller = startVisiblePolling((signal) => new Promise((resolve) => requests.push({ signal, resolve })));
  context.after(() => {
    poller.stop();
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  });
  context.mock.timers.tick(0);
  poller.refresh();
  context.mock.timers.tick(60_000);
  assert.equal(requests.length, 1);
  visibility.change(true);
  assert.equal(requests[0].signal.aborted, true);
  visibility.change(false);
  context.mock.timers.tick(0);
  assert.equal(requests.length, 2);
  requests[0].resolve(1);
  await flush();
  context.mock.timers.tick(10);
  assert.equal(requests.length, 2);
  requests[1].resolve(null);
  await flush();
  poller.refresh();
  visibility.change(true);
  visibility.change(false);
  context.mock.timers.tick(60_000);
  assert.equal(requests.length, 2);
});

test("network failures back off before retrying", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: new Visibility() });
  let calls = 0;
  const poller = startVisiblePolling(async () => { calls++; throw new Error("offline"); });
  context.after(() => {
    poller.stop();
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  });
  context.mock.timers.tick(0);
  await flush();
  context.mock.timers.tick(29_999);
  assert.equal(calls, 1);
  context.mock.timers.tick(1);
  await flush();
  assert.equal(calls, 2);
});

test("a manual refresh during an active poll runs immediately afterward without overlap", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: new Visibility() });
  const requests: Array<(delay: number | null) => void> = [];
  const poller = startVisiblePolling(() => new Promise((resolve) => requests.push(resolve)));
  context.after(() => {
    poller.stop();
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  });
  context.mock.timers.tick(0);
  poller.refresh();
  poller.refresh();
  context.mock.timers.tick(1_000);
  assert.equal(requests.length, 1);
  requests[0](60_000);
  await flush();
  context.mock.timers.tick(0);
  assert.equal(requests.length, 2);
  requests[1](null);
  await flush();
});
