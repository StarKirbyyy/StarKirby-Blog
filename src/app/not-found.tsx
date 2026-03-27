import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="content-shell flex min-h-[70vh] items-center justify-center py-16">
      <section className="glass-panel w-full max-w-2xl rounded-[10px] p-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          页面不存在
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-fg sm:text-base">
          这个链接可能已经失效，或者页面还没有发布。
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            返回首页
          </Link>
          <Link
            href="/posts"
            className="rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            浏览文章
          </Link>
        </div>
      </section>
    </div>
  );
}
