"use client";

import { useEffect, useRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

const EMAIL_USER = "info";
const EMAIL_DOMAIN_NAME = "bhenauto";
const EMAIL_TLD = "com";

export const PUBLIC_EMAIL_HREF = "#email";

export function PublicEmail() {
    return (
        <>
            {EMAIL_USER}<span className="email-at" aria-hidden="true" />{EMAIL_DOMAIN_NAME}<span aria-hidden="true">.</span>{EMAIL_TLD}
        </>
    );
}

export function PublicEmailLink({
    className,
    children,
    ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
    children?: ReactNode;
}) {
    const linkRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (linkRef.current) {
            linkRef.current.href = `mailto:${EMAIL_USER}@${EMAIL_DOMAIN_NAME}.${EMAIL_TLD}`;
        }
    }, []);

    return (
        <a
            {...props}
            ref={linkRef}
            href={PUBLIC_EMAIL_HREF}
            onClick={(event) => {
                props.onClick?.(event);
                if (event.defaultPrevented) return;
                if (linkRef.current?.getAttribute("href") === PUBLIC_EMAIL_HREF) event.preventDefault();
            }}
            className={className}
            aria-label={props["aria-label"] ?? "Email BhenAuto"}
        >
            {children ?? <PublicEmail />}
        </a>
    );
}
