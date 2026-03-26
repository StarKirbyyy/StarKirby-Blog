"use client";

import Link from "next/link";
import { useState } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";

function LoginPanelInner() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const avatarSrc = user?.image ?? "";

  const isLoading = status === "loading";
  const isLoggedIn = Boolean(user);
  const canShowAvatar = avatarSrc.length > 0 && avatarSrc !== failedImageSrc;

  return (
    <section className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-7">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        账号登录
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-fg">
        M1 已接入 GitHub OAuth。登录后会在数据库自动创建或更新用户记录。
      </p>

      <div className="mt-6 rounded-xl border border-border bg-background p-4">
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
                  className="rounded-full border border-border"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-foreground">
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
              <span className="rounded bg-muted px-2 py-1">
                role: {user?.role ?? "user"}
              </span>
              <span className="rounded bg-muted px-2 py-1">
                status: {user?.status ?? "active"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              退出登录
            </button>
            <Link
              href="/settings/profile"
              className="ml-2 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              进入资料设置
            </Link>
            {user?.role === "admin" ? (
              <>
                <Link
                  href="/admin/publish"
                  className="ml-2 inline-flex rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                >
                  进入发布后台
                </Link>
                <Link
                  href="/admin/comments"
                  className="ml-2 inline-flex rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
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
            className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
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
