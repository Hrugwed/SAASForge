import type { MetadataRoute } from "next";
import { productConfig } from "@/lib/product-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/blog", "/privacy", "/terms"].map((path) => ({
    url: `${productConfig.url}${path}`,
    lastModified: new Date(),
  }));
}
