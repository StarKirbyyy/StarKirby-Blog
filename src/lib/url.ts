import { siteConfig } from "@/config/site";

function normalizeUrl(input: string) {
  return input.replace(/\/+$/, "");
}

export function getSiteUrl() {
  return normalizeUrl(siteConfig.url);
}

export function toAbsoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
