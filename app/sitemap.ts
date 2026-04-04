import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ziggyhq.com";
  const now = new Date();
  const routes = [
    { url: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "/login", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/signup", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
    { url: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  ];
  return routes.map((route) => ({ url: `${baseUrl}${route.url}`, lastModified: now, changeFrequency: route.changeFrequency, priority: route.priority }));
}
