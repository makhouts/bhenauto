"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

const MAP_EMBED_URL =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2516.356948124384!2d4.225758377155591!3d50.89861107168115!2m3!1f0!2f0!3f0!2m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3c07cb13d10cd%3A0x14ae28aebd5ab2be!2sBhenauto!5e0!3m2!1sen!2sbe!4v1774786991203!5m2!1sen!2sbe";

const DIRECTIONS_URL =
    "https://www.google.com/maps/dir/?api=1&destination=Bhenauto%2C%20Brusselsesteenweg%20223%2C%201730%20Asse";

export default function DeferredMap() {
    const [loaded, setLoaded] = useState(false);

    if (loaded) {
        return (
            <iframe
                src={MAP_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[20%] contrast-125 transition-all duration-500"
                title="Bhenauto locatie op Google Maps"
            />
        );
    }

    return (
        <div
            className="h-full w-full p-5 flex flex-col justify-between"
            style={{
                background:
                    "linear-gradient(145deg, var(--theme-bg-alt), var(--theme-surface))",
            }}
        >
            <div>
                <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-[#d91c1c]"
                    style={{ backgroundColor: "var(--theme-icon-bg)" }}
                >
                    <MapPin size={20} />
                </div>
                <p className="text-sm font-black theme-text">Bhenauto</p>
                <p className="mt-1 text-xs leading-relaxed theme-text-muted">
                    Brusselsesteenweg 223, 1730 Asse
                </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setLoaded(true)}
                    className="rounded-xl bg-[#d91c1c] px-3 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-[#b91515]"
                >
                    Toon kaart
                </button>
                <a
                    href={DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl px-3 py-2.5 text-center text-xs font-black uppercase tracking-widest theme-text transition-colors hover:text-[#d91c1c]"
                    style={{ border: "1px solid var(--theme-border)" }}
                >
                    Route
                </a>
            </div>
        </div>
    );
}
