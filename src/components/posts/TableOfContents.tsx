"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;

    const ids = items.map((item) => item.id);

    const updateActiveHeading = () => {
      let current = ids[0] ?? "";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 140) {
          current = id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="文章目录"
      className="glass-panel sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-auto rounded-[10px] border border-border/70 p-4"
    >
      <p className="text-base font-bold text-foreground sm:text-lg">目录</p>
      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const levelClass =
            item.level === 1
              ? "pl-1"
              : item.level === 2
                ? "pl-3"
                : item.level === 3
                  ? "pl-5"
                  : item.level === 4
                    ? "pl-7"
                    : item.level === 5
                      ? "pl-9"
                      : "pl-11";

          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                className={`block py-1.5 text-sm transition-colors ${levelClass} ${
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-fg hover:text-foreground"
                }`}
              >
                {item.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
