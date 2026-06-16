import { revalidatePath } from "next/cache";
import { locales } from "@/lib/i18n";

export function revalidateLocalizedPath(path: string): void {
  const normalizedPath = path || "/";
  revalidatePath(normalizedPath);
  for (const locale of locales) {
    revalidatePath(path ? `/${locale}${path}` : `/${locale}`);
  }
}
