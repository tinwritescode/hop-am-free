import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin() ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/cli", "/sign-in"] },
    sitemap: new URL("/sitemap.xml", origin).href,
  };
}
