"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";

function isGiscusConfigured() {
  const giscus = siteConfig.comments.giscus;
  return Boolean(
    giscus.repo &&
      giscus.repoId &&
      giscus.category &&
      giscus.categoryId,
  );
}

export function GiscusComments() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isGiscusConfigured()) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";
    const script = document.createElement("script");
    const giscus = siteConfig.comments.giscus;

    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", giscus.repo);
    script.setAttribute("data-repo-id", giscus.repoId);
    script.setAttribute("data-category", giscus.category);
    script.setAttribute("data-category-id", giscus.categoryId);
    script.setAttribute("data-mapping", giscus.mapping);
    script.setAttribute("data-strict", giscus.strict);
    script.setAttribute("data-reactions-enabled", giscus.reactionsEnabled);
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", giscus.inputPosition);
    script.setAttribute("data-theme", giscus.theme);
    script.setAttribute("data-lang", giscus.lang);
    script.setAttribute("data-loading", "lazy");

    container.appendChild(script);
  }, []);

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        评论
      </h2>
      {isGiscusConfigured() ? (
        <div ref={containerRef} className="mt-4" />
      ) : (
        <p className="mt-3 text-sm text-muted-fg">
          已预留评论区，配置 Giscus 环境变量后会自动启用。
        </p>
      )}
    </section>
  );
}
