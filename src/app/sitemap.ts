import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_APP_URL ?? "https://restaurantpro.local";
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  const urls = ["/"];

  return urls.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
