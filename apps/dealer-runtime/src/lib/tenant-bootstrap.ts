import {
    TENANT_FEATURE_KEYS,
    getTenantBootstrapAddress as getTenantBootstrapAddressBase,
    getTenantBootstrapEmailParts as getTenantBootstrapEmailPartsBase,
    getTenantBootstrapImageHosts as getTenantBootstrapImageHostsBase,
    getTenantBootstrapPhoneHref as getTenantBootstrapPhoneHrefBase,
    getTenantBootstrapSiteUrl as getTenantBootstrapSiteUrlBase,
    getTenantBootstrapWhatsappUrl as getTenantBootstrapWhatsappUrlBase,
    type TenantBootstrap,
    type TenantFeatureFlags,
    type TenantFeatureKey,
} from "../../../../packages/core/src/tenant/bootstrap";
import {
    STATIC_DEALER_BOOTSTRAPS,
    getStaticDealerBootstrap,
} from "../../../../packages/dealers/registry/src";

const configuredDefaultSlug = process.env.DEFAULT_TENANT_SLUG || "bhenauto";
const fallbackBootstrap = getStaticDealerBootstrap(configuredDefaultSlug) || getStaticDealerBootstrap("bhenauto");

if (!fallbackBootstrap) {
    throw new Error("No static dealer bootstrap registered. Add a dealer package under packages/dealers first.");
}

const DEFAULT_TENANT_BOOTSTRAP: TenantBootstrap = fallbackBootstrap;

function getTenantBootstrapSiteUrl(tenant: TenantBootstrap = DEFAULT_TENANT_BOOTSTRAP) {
    return getTenantBootstrapSiteUrlBase(tenant);
}

function getTenantBootstrapImageHosts(tenant: TenantBootstrap = DEFAULT_TENANT_BOOTSTRAP) {
    return getTenantBootstrapImageHostsBase(tenant);
}

function getTenantBootstrapEmailParts(tenant: TenantBootstrap = DEFAULT_TENANT_BOOTSTRAP) {
    return getTenantBootstrapEmailPartsBase(tenant);
}

function getTenantBootstrapAddress(tenant: TenantBootstrap = DEFAULT_TENANT_BOOTSTRAP) {
    return getTenantBootstrapAddressBase(tenant);
}

function getTenantBootstrapPhoneHref(tenant: TenantBootstrap = DEFAULT_TENANT_BOOTSTRAP) {
    return getTenantBootstrapPhoneHrefBase(tenant);
}

function getTenantBootstrapWhatsappUrl(tenant: TenantBootstrap = DEFAULT_TENANT_BOOTSTRAP) {
    return getTenantBootstrapWhatsappUrlBase(tenant);
}

export {
    DEFAULT_TENANT_BOOTSTRAP,
    STATIC_DEALER_BOOTSTRAPS,
    TENANT_FEATURE_KEYS,
    getTenantBootstrapAddress,
    getTenantBootstrapEmailParts,
    getTenantBootstrapImageHosts,
    getTenantBootstrapPhoneHref,
    getTenantBootstrapSiteUrl,
    getTenantBootstrapWhatsappUrl,
    type TenantBootstrap,
    type TenantFeatureFlags,
    type TenantFeatureKey,
};
