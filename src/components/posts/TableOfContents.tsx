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
      className="glass-panel sticky top-24 rounded-[10px] p-4"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-fg">目录</p>
      <ul className="mt-3 space-y-1 border-l border-border/70 pl-1.5">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <Link
                href={`#${item.id}`}
                className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                  item.level === 3 ? "ml-3" : ""
                } ${
                  isActive
                    ? "bg-surface-soft font-medium text-foreground"
                    : "text-muted-fg hover:bg-surface-soft hover:text-foreground"
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
