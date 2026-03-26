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
    redirect("/login?callbackUrl=%2Fadmin%2Fpublish");
  }

  if (session.user.status === "disabled") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">
          当前账号已被禁用，无法访问后台。
        </section>
      </div>
    );
  }

  if (session.user.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h1 className="text-lg font-semibold text-foreground">权限不足</h1>
          <p className="mt-2 text-sm text-muted-fg">
            你的账号角色不是 `admin`，无法访问后台发布页面。
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/settings/profile"
              className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              查看我的资料
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              返回首页
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
