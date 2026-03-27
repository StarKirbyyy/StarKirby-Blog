"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { readEffectiveSakurairoPreferencesFromRoot } from "@/lib/sakurairo-preferences";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const pathname = usePathname() ?? "/";
  const [isHovered, setIsHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [whiteCatText, setWhiteCatText] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => {
      const preferences = readEffectiveSakurairoPreferencesFromRoot();
      setLogoUrl(preferences.preliminaryNavLogoUrl);
      setWhiteCatText(preferences.preliminaryWhiteCatText);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
    };
  }, []);

  return (
    <header className="fixed left-0 top-0 z-40 w-full px-3 pt-2.5 sm:px-5 sm:pt-3">
      <div
        className={`mx-auto flex h-[64px] w-full max-w-[1120px] items-center gap-2 transition-all duration-500 sm:h-[70px] ${
          isHovered || isScrolled ? "" : "md:gap-3"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link
          href="/"
          className={`group inline-flex h-[42px] items-center gap-2 rounded-full px-3.5 py-1.5 font-medium text-foreground transition-all duration-500 sm:h-[45px] ${
            isHovered || isScrolled ? "glass-panel" : "md:bg-transparent md:shadow-none md:backdrop-blur-none"
          }`}
          aria-label="返回首页"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="导航 Logo"
              className="h-6 w-6 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-accent transition-transform duration-200 group-hover:rotate-12"
              aria-hidden="true"
            >
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          )}
          <span
            className={`text-sm tracking-[0.04em] sm:text-base ${whiteCatText ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" : ""}`}
          >
            {siteConfig.name}
          </span>
        </Link>

        <nav
          aria-label="主导航"
          className={`hidden h-[45px] min-w-0 flex-1 items-center rounded-full px-1.5 transition-all duration-500 md:flex ${
            isHovered || isScrolled ? "glass-panel" : "md:bg-transparent md:shadow-none md:backdrop-blur-none"
          }`}
        >
          {siteConfig.nav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-pill group relative px-3.5 py-2 text-sm font-normal transition-colors ${
                  isActive
                    ? "nav-pill-active"
                    : "text-muted-fg hover:bg-surface-soft hover:text-foreground"
                }`}
              >
                {item.title}
                <span
                  className={`absolute bottom-[5px] left-1/2 h-[1.5px] -translate-x-1/2 rounded-full bg-accent transition-all duration-300 ${
                    isActive ? "w-8 opacity-100" : "w-0 opacity-0 group-hover:w-7 group-hover:opacity-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div
          className={`flex h-[42px] items-center gap-1 rounded-full px-1.5 transition-all duration-500 sm:h-[45px] ${
            isHovered || isScrolled ? "glass-panel" : "md:bg-transparent md:shadow-none md:backdrop-blur-none"
          }`}
        >
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-1.5 text-sm text-muted-fg transition-colors hover:bg-surface-soft hover:text-foreground sm:inline-flex"
          >
            登录
          </Link>

          <a
            href={siteConfig.author.social.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub 主页"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-fg transition-colors hover:bg-surface-soft hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          <ThemeToggle />
          <MobileMenu currentPath={pathname} />
        </div>
      </div>
    </header>
  );
}
