import { revalidatePath, revalidateTag } from "next/cache";
import { locales } from "@/lib/i18n";
import { INVENTORY_CACHE_TAG } from "@/lib/cars/cache-policy";

export function revalidateInventory() {
  // expire: 0 works in both Server Actions and cron Route Handlers. A changed
  // price or sold status must be fresh on the next request, not served stale.
  revalidateTag(INVENTORY_CACHE_TAG, { expire: 0 });
  revalidatePath("/admin/cars");
  revalidateLocalizedPath("");
  revalidateLocalizedPath("/inventory");
  revalidateLocalizedPath("/site-map");
  revalidatePath("/[lang]/cars/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

export function revalidateLocalizedPath(path: string): void {
  const normalizedPath = path || "/";
  revalidatePath(normalizedPath);
  for (const locale of locales) {
    revalidatePath(path ? `/${locale}${path}` : `/${locale}`);
  }
}
