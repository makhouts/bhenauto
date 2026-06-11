"use client";

import { useEffect, useRef } from "react";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";

export default function CarDetailAnalyticsTracker({
  carId,
  locale,
  path,
}: {
  carId: string;
  locale: string;
  path: string;
}) {
  const sentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${carId}:${path}`;
    if (sentKeyRef.current === key) return;

    trackClientAnalyticsEvent({
      type: "car_detail_view",
      path,
      locale,
      carId,
    });
    sentKeyRef.current = key;
  }, [carId, locale, path]);

  return null;
}
