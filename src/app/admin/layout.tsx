import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin%2Fposts");
  }

  if (session.user.status === "disabled") {
    return (
      <div className="content-shell pb-10 pt-5 sm:pt-7">
        <section className="glass-panel rounded-[10px] border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">
          当前账号已被禁用，无法访问后台。
        </section>
      </div>
    );
  }

  if (session.user.role !== "admin") {
    return (
      <div className="content-shell pb-10 pt-5 sm:pt-7">
        <section className="glass-panel rounded-[10px] border-amber-500/30 bg-amber-500/10 p-6">
          <h1 className="text-lg font-semibold text-foreground">权限不足</h1>
          <p className="mt-2 text-sm text-muted-fg">
            你的账号角色不是 `admin`，无法访问后台页面。
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/settings/profile"
              className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              查看我的资料
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
            >
              返回首页
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="content-shell pt-3">
        <div className="glass-panel mx-auto flex w-full items-center gap-2 rounded-[10px] px-4 py-3 sm:px-5">
          <Link
            href="/admin/publish"
            className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            发布文章
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            文章管理
          </Link>
          <Link
            href="/admin/comments"
            className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            评论管理
          </Link>
          <Link
            href="/admin/theme"
            className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            主题设置
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}
