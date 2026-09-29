// Schedule the next poll only after the previous request completes. Hidden
// tabs abort in-flight work and resume with a fresh read when visible again.
export function startVisiblePolling(
  poll: (signal: AbortSignal) => Promise<number | null>,
  initialDelay = 0,
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: AbortController | undefined;
  let refreshQueued = false;

  const pause = () => {
    clearTimeout(timer);
    timer = undefined;
    active?.abort();
    active = undefined;
    refreshQueued = false;
  };

  const schedule = (delay: number) => {
    clearTimeout(timer);
    if (!stopped && !document.hidden) timer = setTimeout(() => { void run(); }, delay);
  };

  const run = async () => {
    if (stopped || document.hidden || active) return;
    const controller = new AbortController();
    active = controller;
    let nextDelay: number | null = 30_000;
    try {
      nextDelay = await poll(controller.signal);
    } catch {
      // Back off on transient errors. Callers can return null on auth failures.
    } finally {
      // A paused or superseded request cannot restart polling or clear a newer one.
      if (active === controller) {
        active = undefined;
        if (nextDelay === null) stopped = true;
        else schedule(refreshQueued ? 0 : nextDelay);
        refreshQueued = false;
      }
    }
  };

  const onVisibilityChange = () => {
    pause();
    schedule(0);
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  schedule(initialDelay);

  return {
    refresh: () => {
      if (active) refreshQueued = true;
      else schedule(0);
    },
    stop: () => {
      stopped = true;
      pause();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
