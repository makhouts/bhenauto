"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";

export default function PublicAnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTrackedPathRef.current === pathname) return;

    trackClientAnalyticsEvent({
      type: "page_view",
      path: pathname,
      locale,
      referrer: previousPathRef.current ? undefined : document.referrer || undefined,
      meta: previousPathRef.current ? { previousPath: previousPathRef.current } : undefined,
    });

    previousPathRef.current = pathname;
    lastTrackedPathRef.current = pathname;
  }, [locale, pathname]);

  return null;
}
