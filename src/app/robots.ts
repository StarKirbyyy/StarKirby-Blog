import type { MetadataRoute } from "next";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
