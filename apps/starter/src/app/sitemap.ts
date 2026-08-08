import type { MetadataRoute } from "next";
import { productConfig } from "@saasforge/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: productConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
