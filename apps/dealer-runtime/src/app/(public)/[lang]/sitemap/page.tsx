import { permanentRedirect } from "next/navigation";

export default async function LegacySitemapPage() {
  permanentRedirect("/sitemap.xml");
}
