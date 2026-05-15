"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileWidgetId = string;
type TurnstileStatus = "idle" | "ready" | "verifying" | "error";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  "timeout-callback"?: () => void;
  "unsupported-callback"?: () => void;
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  size?: "normal" | "compact" | "flexible";
  theme?: "auto" | "light" | "dark";
  action?: string;
  cData?: string;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
  execute: (widgetId: TurnstileWidgetId) => void;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove?: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type PendingChallenge = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

type UseTurnstileOptions = {
  siteKey?: string;
  action?: string;
  cData?: string;
  theme?: "auto" | "light" | "dark";
};

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const LOAD_TIMEOUT_MS = 10_000;
const CHALLENGE_TIMEOUT_MS = 15_000;
let scriptPromise: Promise<void> | null = null;

function waitForTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const fail = (message: string) => {
      scriptPromise = null;
      reject(new Error(message));
    };

    const waitForApi = () => {
      const start = Date.now();
      const poll = () => {
        if (window.turnstile) {
          resolve();
        } else if (Date.now() - start > LOAD_TIMEOUT_MS) {
          fail("Turnstile did not load in time.");
        } else {
          window.setTimeout(poll, 100);
        }
      };
      poll();
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", waitForApi, { once: true });
      existing.addEventListener("error", () => fail("Turnstile failed to load."), { once: true });
      waitForApi();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", waitForApi, { once: true });
    script.addEventListener("error", () => fail("Turnstile failed to load."), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function useTurnstile({
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  action,
  cData,
  theme = "auto",
}: UseTurnstileOptions = {}) {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const pendingRef = useRef<PendingChallenge | null>(null);
  const renderPromiseRef = useRef<Promise<void>>(Promise.resolve());
  const renderErrorRef = useRef<Error | null>(null);
  const [status, setStatus] = useState<TurnstileStatus>(siteKey ? "idle" : "ready");

  const rejectPending = useCallback((message: string) => {
    if (!pendingRef.current) return;
    window.clearTimeout(pendingRef.current.timeoutId);
    pendingRef.current.reject(new Error(message));
    pendingRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!siteKey) {
      renderErrorRef.current = null;
      renderPromiseRef.current = Promise.resolve();
      return;
    }

    if (!containerNode) {
      renderPromiseRef.current = Promise.resolve();
      return;
    }

    renderErrorRef.current = null;
    renderPromiseRef.current = waitForTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile || widgetIdRef.current) return;

        const widgetId = window.turnstile.render(containerNode, {
          sitekey: siteKey,
          execution: "execute",
          appearance: "interaction-only",
          size: "flexible",
          theme,
          ...(action ? { action } : {}),
          ...(cData ? { cData } : {}),
          callback: (token: string) => {
            const pending = pendingRef.current;
            pendingRef.current = null;
            if (pending) window.clearTimeout(pending.timeoutId);
            setStatus("ready");
            pending?.resolve(token);
          },
          "expired-callback": () => {
            rejectPending("Turnstile token expired.");
            setStatus("ready");
          },
          "error-callback": () => {
            rejectPending("Turnstile verification failed.");
            setStatus("error");
          },
          "timeout-callback": () => {
            rejectPending("Turnstile verification timed out.");
            setStatus("ready");
          },
          "unsupported-callback": () => {
            rejectPending("Turnstile is unsupported in this browser.");
            setStatus("error");
          },
        });

        widgetIdRef.current = widgetId;
        setStatus("ready");
      })
      .catch((error) => {
        renderErrorRef.current = error instanceof Error ? error : new Error("Turnstile failed to load.");
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      rejectPending("Turnstile was unloaded.");
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, cData, containerNode, rejectPending, siteKey, theme]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    rejectPending("Turnstile was reset.");
    setStatus("ready");
  }, [rejectPending]);

  const execute = useCallback(async () => {
    if (!siteKey) return "";

    await renderPromiseRef.current;
    if (renderErrorRef.current) throw renderErrorRef.current;

    const turnstile = window.turnstile;
    const widgetId = widgetIdRef.current;
    if (!turnstile || !widgetId) {
      setStatus("error");
      throw new Error("Turnstile is not ready.");
    }

    if (pendingRef.current) {
      window.clearTimeout(pendingRef.current.timeoutId);
      pendingRef.current.reject(new Error("Turnstile verification restarted."));
      pendingRef.current = null;
    }

    turnstile.reset(widgetId);
    setStatus("verifying");

    return new Promise<string>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        if (!pendingRef.current) return;
        pendingRef.current = null;
        setStatus("ready");
        reject(new Error("Turnstile verification timed out."));
      }, CHALLENGE_TIMEOUT_MS);

      pendingRef.current = { resolve, reject, timeoutId };
      try {
        turnstile.execute(widgetId);
      } catch (error) {
        window.clearTimeout(timeoutId);
        pendingRef.current = null;
        setStatus("error");
        reject(error instanceof Error ? error : new Error("Turnstile execution failed."));
      }
    });
  }, [siteKey]);

  return {
    containerRef: setContainerNode,
    execute,
    reset,
    status,
    isVerifying: status === "verifying",
    isEnabled: Boolean(siteKey),
  };
}
