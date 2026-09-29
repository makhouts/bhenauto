// Shared by all public inventory reads, including locale variants and sitemaps.
export const INVENTORY_CACHE_TAG = "public-inventory";
export const INVENTORY_CACHE_SECONDS = 300;
export const INVENTORY_CACHE_OPTIONS = {
  revalidate: INVENTORY_CACHE_SECONDS,
  tags: [INVENTORY_CACHE_TAG],
};
