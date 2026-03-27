"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

interface MobileMenuProps {
  currentPath?: string;
}

export function MobileMenu({ currentPath }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  // 打开菜单时禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* 汉堡按钮 */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-surface-soft hover:text-foreground md:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            /* X 图标 */
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            /* 汉堡图标 */
            <>
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 抽屉菜单 */}
      <nav
        aria-label="移动端导航"
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-border bg-surface px-6 py-8 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={() => setOpen(false)}
          aria-label="关闭导航菜单"
          className="mb-8 self-end flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface-soft text-muted-fg transition-colors hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 导航链接 */}
        <ul className="flex flex-col gap-1">
          {siteConfig.nav.map((item) => {
            const isActive =
              item.href === "/"
                ? currentPath === "/"
                : currentPath === item.href || currentPath?.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-accent/14 text-accent"
                      : "text-muted-fg hover:bg-surface-soft hover:text-foreground"
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={`mt-1 flex items-center rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                currentPath === "/login"
                  ? "bg-accent/14 text-accent"
                  : "text-muted-fg hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              登录
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
