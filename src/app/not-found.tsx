import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-border bg-card px-8 py-10">
        <p className="text-sm font-medium text-accent">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          页面不存在
        </h1>
        <p className="mt-4 text-base text-muted-fg">
          这个链接可能已经失效，或者页面还没有发布。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            返回首页
          </Link>
          <Link
            href="/posts"
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
          >
            浏览文章
          </Link>
        </div>
      </div>
    </div>
  );
}
