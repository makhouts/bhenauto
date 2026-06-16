import type { AnchorHTMLAttributes, ReactNode } from "react";
import { DEFAULT_TENANT_BOOTSTRAP, getTenantBootstrapEmailParts } from "@/lib/tenant-bootstrap";

const EMAIL_PARTS = getTenantBootstrapEmailParts(DEFAULT_TENANT_BOOTSTRAP);
const EMAIL_USER = EMAIL_PARTS.user;
const EMAIL_DOMAIN_NAME = EMAIL_PARTS.domainName;
const EMAIL_TLD = EMAIL_PARTS.tld;

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
            aria-label={props["aria-label"] ?? `Email ${DEFAULT_TENANT_BOOTSTRAP.displayName}`}
        >
            {children ?? <PublicEmail />}
        </a>
    );
}
