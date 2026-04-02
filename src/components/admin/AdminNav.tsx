"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin/publish", label: "发布文章" },
  { href: "/admin/posts", label: "文章管理" },
  { href: "/admin/comments", label: "评论管理" },
  { href: "/admin/theme", label: "主题设置" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="admin-nav-wrap">
      <div className="glass-panel admin-nav-shell">
        <Link href="/" className="admin-nav-home">
          返回首页
        </Link>
        <nav className="admin-nav-links" aria-label="后台导航">
          {adminNavItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${active ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
