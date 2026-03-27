"use client";

import Link from "next/link";
import { useState } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { siteConfig } from "@/config/site";

function LoginPanelInner() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const avatarSrc = user?.image ?? "";

  const isLoading = status === "loading";
  const isLoggedIn = Boolean(user);
  const canShowAvatar = avatarSrc.length > 0 && avatarSrc !== failedImageSrc;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">Account</p>
        <h1
          className={`${siteConfig.sakurairo.pageTitleAnimation ? "sakurairo-page-title " : ""}mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl`}
          style={{
            ["--sakurairo-title-duration" as string]: `${siteConfig.sakurairo.pageTitleAnimationDuration}s`,
          }}
        >
          账号登录
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-fg">
          使用 GitHub 登录，系统会自动创建或更新你的用户资料。
        </p>
      </header>

      <div className="glass-panel rounded-[10px] p-5 sm:p-6">
        {isLoading ? (
          <p className="text-sm text-muted-fg">正在检查登录状态...</p>
        ) : isLoggedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {canShowAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt={user?.name ?? "用户头像"}
                  width={44}
                  height={44}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImageSrc(avatarSrc)}
                  className="rounded-full border border-border/70"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-surface-soft text-sm font-medium text-foreground">
                  {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name ?? "未命名用户"}
                </p>
                <p className="truncate text-xs text-muted-fg">
                  {user?.email ?? "无邮箱"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-fg">
              <span className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1">
                role: {user?.role ?? "user"}
              </span>
              <span className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1">
                status: {user?.status ?? "active"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
            >
              退出登录
            </button>
            <Link
              href="/settings/profile"
              className="ml-2 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              进入资料设置
            </Link>
            {user?.role === "admin" ? (
              <>
                <Link
                  href="/admin/publish"
                  className="ml-2 inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
                >
                  进入发布后台
                </Link>
                <Link
                  href="/admin/posts"
                  className="ml-2 inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
                >
                  管理文章
                </Link>
                <Link
                  href="/admin/comments"
                  className="ml-2 inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
                >
                  管理评论
                </Link>
              </>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            使用 GitHub 登录
          </button>
        )}
      </div>

      {!process.env.NEXT_PUBLIC_SITE_URL ? (
        <p className="mt-4 text-xs text-muted-fg">
          提示：建议配置 `NEXTAUTH_URL` 和 `NEXT_PUBLIC_SITE_URL`，避免 OAuth 回调地址错误。
        </p>
      ) : null}
    </section>
  );
}

export function LoginPanel() {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <LoginPanelInner />
    </SessionProvider>
  );
}
