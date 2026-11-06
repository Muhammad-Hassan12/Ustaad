import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about"],
      disallow: ["/dashboard/", "/interview/", "/dossier/", "/resume/"],
    },
    sitemap: "https://www.ustaad.systems/sitemap.xml",
  };
}
