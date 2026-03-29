"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { readEffectiveSakurairoPreferencesFromRoot } from "@/lib/sakurairo-preferences";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";

type SessionPayload = {
  user?: {
    id?: string;
    image?: string | null;
    role?: "user" | "admin";
  } | null;
} | null;

export function Header() {
  const pathname = usePathname() ?? "/";
  const [logoUrl, setLogoUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [mounted, setMounted] = useState(false);
  const [homeNavState, setHomeNavState] = useState<"idle" | "prep" | "ready">("idle");

  useEffect(() => {
    const syncTheme = () => {
      const preferences = readEffectiveSakurairoPreferencesFromRoot();
      setLogoUrl(preferences.preliminaryNavLogoUrl);
    };
    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("sakurairo:preferences-change", syncTheme as EventListener);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("sakurairo:preferences-change", syncTheme as EventListener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!active) return;
        if (!response.ok) {
          setIsLoggedIn(false);
          setUserAvatarUrl("");
          setUserRole("user");
          return;
        }
        const session = (await response.json()) as SessionPayload;
        const userId = typeof session?.user?.id === "string" ? session.user.id : "";
        const role = session?.user?.role === "admin" ? "admin" : "user";
        const image =
          typeof session?.user?.image === "string" && session.user.image.trim()
            ? session.user.image.trim()
            : "";

        setIsLoggedIn(Boolean(userId));
        setUserRole(role);
        setUserAvatarUrl(image);
      } catch {
        if (!active) return;
        setIsLoggedIn(false);
        setUserAvatarUrl("");
        setUserRole("user");
      }
    };

    void syncSession();
    window.addEventListener("focus", syncSession);
    return () => {
      active = false;
      window.removeEventListener("focus", syncSession);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      setHomeNavState("idle");
      return;
    }
    if (!mounted) {
      return;
    }

    setHomeNavState(
      document.documentElement.dataset.homeHeroReady === "true" ? "ready" : "prep",
    );

    const onReady = () => {
      setHomeNavState("ready");
    };
    window.addEventListener("home:hero-resources-ready", onReady);
    return () => window.removeEventListener("home:hero-resources-ready", onReady);
  }, [mounted, pathname]);

  const homeNavClass =
    homeNavState === "prep"
      ? "home-nav-enter-prep"
      : homeNavState === "ready"
        ? "home-nav-enter-ready"
        : "";
  const headerClassName = [
    "fixed left-0 top-0 z-40 w-full px-3 pt-2.5 sm:px-5 sm:pt-3",
    homeNavClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
      <div className="mx-auto flex h-[48px] w-fit max-w-[calc(100vw-1.5rem)] items-center gap-5 rounded-full bg-transparent px-1 sm:h-[52px] sm:max-w-[calc(100vw-2.5rem)] sm:px-2">
        <Link
          href="/"
          className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface-strong text-foreground shadow-[var(--shadow-soft)] transition-colors hover:text-accent sm:h-10 sm:w-10"
          aria-label="返回首页"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="导航 Logo"
              className="h-6 w-6 rounded-full object-cover sm:h-7 sm:w-7"
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
        </Link>

        <nav aria-label="主导航" className="hidden items-center md:flex">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface-strong px-2 py-1 shadow-[var(--shadow-soft)]">
            {siteConfig.nav.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill group relative px-3 text-base font-medium transition-colors ${
                    isActive
                      ? "nav-pill-active"
                      : "text-muted-fg hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.title}
                  <span
                    className={`absolute bottom-[4px] left-1/2 h-[1.5px] -translate-x-1/2 rounded-full bg-accent transition-all duration-300 ${
                      isActive
                        ? "w-8 opacity-100"
                        : "w-0 opacity-0 group-hover:w-7 group-hover:opacity-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center justify-end gap-1">
          {isLoggedIn ? (
            <Link
              href={userRole === "admin" ? "/admin/posts" : "/settings/profile"}
              className="hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-surface-strong shadow-[var(--shadow-soft)] transition-colors hover:border-accent/60 sm:inline-flex sm:h-10 sm:w-10"
              aria-label={userRole === "admin" ? "管理后台" : "个人中心"}
            >
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userAvatarUrl}
                  alt="用户头像"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-muted-fg"
                  aria-hidden="true"
                >
                  <path d="M12 12c2.97 0 5.4-2.43 5.4-5.4S14.97 1.2 12 1.2 6.6 3.63 6.6 6.6 9.03 12 12 12zm0 2.4c-3.61 0-10.8 1.81-10.8 5.4v2.4h21.6v-2.4c0-3.59-7.19-5.4-10.8-5.4z" />
                </svg>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-full border border-border/70 bg-surface-strong px-4 text-base font-medium text-muted-fg shadow-[var(--shadow-soft)] transition-colors hover:text-foreground sm:inline-flex sm:h-10"
            >
              登录
            </Link>
          )}

          <ThemeToggle />
          <MobileMenu currentPath={pathname} />
        </div>
      </div>
    </header>
  );
}
