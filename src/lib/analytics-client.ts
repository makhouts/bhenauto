"use client";

export const CLIENT_ANALYTICS_EVENT_TYPES = [
  "page_view",
  "car_detail_view",
  "car_card_click",
] as const;

export type ClientAnalyticsEventType = (typeof CLIENT_ANALYTICS_EVENT_TYPES)[number];

type TrackClientAnalyticsEventInput = {
  type: ClientAnalyticsEventType;
  path: string;
  locale?: string | null;
  carId?: string | null;
  referrer?: string | null;
  meta?: Record<string, string | number | boolean | null>;
};

function postAnalytics(payload: TrackClientAnalyticsEventInput) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const sent = navigator.sendBeacon(
      "/api/analytics",
      new Blob([body], { type: "application/json" })
    );
    if (sent) return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackClientAnalyticsEvent(input: TrackClientAnalyticsEventInput) {
  if (typeof window === "undefined") return;
  postAnalytics(input);
}
