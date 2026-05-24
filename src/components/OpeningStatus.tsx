"use client";

import { useEffect, useState } from "react";

const SHOWROOM_TIME_ZONE = "Europe/Brussels";

function getIsOpen(now: Date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: SHOWROOM_TIME_ZONE,
        weekday: "short",
        hour: "numeric",
        hour12: false,
    }).formatToParts(now);

    const weekday = parts.find((part) => part.type === "weekday")?.value;
    const hourValue = parts.find((part) => part.type === "hour")?.value;
    const hour = hourValue ? Number.parseInt(hourValue, 10) : Number.NaN;

    const isOpenDay = weekday !== "Sun";
    return isOpenDay && hour >= 10 && hour < 18;
}

export default function OpeningStatus({
    openLabel,
    closedLabel,
}: {
    openLabel: string;
    closedLabel: string;
}) {
    const [isOpen, setIsOpen] = useState(() => getIsOpen(new Date()));

    useEffect(() => {
        const updateStatus = () => setIsOpen(getIsOpen(new Date()));

        updateStatus();

        const intervalId = window.setInterval(updateStatus, 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-block h-2 w-2 rounded-full ${isOpen ? "bg-green-400 animate-pulse" : ""}`}
                style={!isOpen ? { backgroundColor: "var(--theme-text-faint)" } : {}}
            />
            <span className="text-[12px] theme-text-muted font-semibold">
                {isOpen ? openLabel : closedLabel}
            </span>
        </div>
    );
}
