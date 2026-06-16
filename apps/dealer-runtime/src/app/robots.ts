import { MetadataRoute } from "next";
import { DEFAULT_TENANT_BOOTSTRAP } from "@/lib/tenant-bootstrap";

const BASE_URL = DEFAULT_TENANT_BOOTSTRAP.siteUrl;

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin/", "/api/"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
