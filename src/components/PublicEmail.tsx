import type { AnchorHTMLAttributes, ReactNode } from "react";

const EMAIL_USER = "info";
const EMAIL_DOMAIN_NAME = "bhenauto";
const EMAIL_TLD = "com";

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
    const href = `mailto:${EMAIL_USER}@${EMAIL_DOMAIN_NAME}.${EMAIL_TLD}`;

    return (
        <a
            {...props}
            href={href}
            className={className}
            aria-label={props["aria-label"] ?? "Email BhenAuto"}
        >
            {children ?? <PublicEmail />}
        </a>
    );
}
