import type { TenantBootstrap } from "../../../core/src/tenant/bootstrap";
import { bhenautoTenantBootstrap } from "../../bhenauto/src";

// dealer-imports:start
// dealer-imports:end

export const STATIC_DEALER_BOOTSTRAPS = {
    [bhenautoTenantBootstrap.slug]: bhenautoTenantBootstrap,
    // dealer-entries:start
    // dealer-entries:end
} satisfies Record<string, TenantBootstrap>;

export function getStaticDealerBootstrap(slug: string) {
    return STATIC_DEALER_BOOTSTRAPS[slug] ?? null;
}

export function getStaticDealerBootstraps() {
    return Object.values(STATIC_DEALER_BOOTSTRAPS);
}
