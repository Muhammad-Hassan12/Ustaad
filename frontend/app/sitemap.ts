import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.ustaad.systems",
      lastModified: new Date("2026-11-06"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.ustaad.systems/about",
      lastModified: new Date("2026-11-06"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
