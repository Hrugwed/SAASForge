import type { MetadataRoute } from "next";
import { productConfig } from "@saasforge/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard/"] }],
    sitemap: `${productConfig.url}/sitemap.xml`,
  };
}
