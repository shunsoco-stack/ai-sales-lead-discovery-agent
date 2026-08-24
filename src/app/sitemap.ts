import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-sales-lead-discovery-agent.vercel.app",
      lastModified: "2026-08-25",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
