"use client";

import { useEffect, useState } from "react";

type PostViewCounterProps = {
  slug: string;
  initialCount?: number;
};

const VIEW_TRACKER_KEY_PREFIX = "post-view-tracked:";
const VIEW_TRACKER_TTL_MS = 6 * 60 * 60 * 1000;

function formatCount(count: number | null) {
  if (typeof count !== "number" || !Number.isFinite(count)) {
    return "--";
  }
  return count.toLocaleString("zh-CN");
}

export function PostViewCounter({ slug, initialCount }: PostViewCounterProps) {
  const [count, setCount] = useState<number | null>(
    typeof initialCount === "number" ? initialCount : null,
  );

  useEffect(() => {
    const now = Date.now();
    const key = `${VIEW_TRACKER_KEY_PREFIX}${slug}`;

    try {
      const lastTracked = Number.parseInt(window.localStorage.getItem(key) ?? "0", 10);
      if (Number.isFinite(lastTracked) && now - lastTracked < VIEW_TRACKER_TTL_MS) {
        return;
      }
    } catch {
      // ignore storage errors
    }

    const controller = new AbortController();
    void fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-view-tracker": "1",
      },
      signal: controller.signal,
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = (await response.json()) as { viewCount?: number };
        if (typeof payload.viewCount === "number") {
          setCount(payload.viewCount);
          try {
            window.localStorage.setItem(key, String(now));
          } catch {
            // ignore storage errors
          }
        }
        return null;
      })
      .catch(() => null);

    return () => controller.abort();
  }, [slug]);

  return <span>{formatCount(count)} 次阅读</span>;
}
