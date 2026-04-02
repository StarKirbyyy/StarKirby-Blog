import type { Metadata } from "next";
import Link from "next/link";
import { PostListCard } from "@/components/posts/PostListCard";
import { siteConfig } from "@/config/site";
import { getAllPosts, searchPosts } from "@/lib/posts";
import { NewsletterSignupCard } from "@/components/newsletter/NewsletterSignupCard";

interface PostsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
}

export const metadata: Metadata = {
  title: "文章",
  description: "StarKirby Blog 的全部文章列表。",
  alternates: {
    canonical: "/posts",
  },
};

export const revalidate = 3600;

function parsePageNumber(input?: string) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 1;
  const page = Math.trunc(parsed);
  return page > 0 ? page : 1;
}

function getPageHref(page: number, query: string) {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  if (query) {
    params.set("q", query);
  }
  const suffix = params.toString();
  return suffix ? `/posts?${suffix}` : "/posts";
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { page: rawPage, q: rawQuery } = await searchParams;
  const query = (rawQuery ?? "").trim();
  const allPosts = query ? await searchPosts(query) : await getAllPosts();

  const postsPerPage = siteConfig.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(allPosts.length / postsPerPage));
  const currentPage = Math.min(parsePageNumber(rawPage), totalPages);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = allPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel overflow-hidden rounded-[10px] p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">
              Archive
            </p>
            <h1
              className="sakurairo-page-title mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl"
            >
              全部文章
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            返回首页
          </Link>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted-fg">
          {query
            ? `关键词「${query}」共命中 ${allPosts.length} 篇文章，当前第 ${currentPage}/${totalPages} 页。`
            : `共 ${allPosts.length} 篇文章，当前第 ${currentPage}/${totalPages} 页。`}
        </p>
        <form className="mt-5 flex flex-wrap items-center gap-2" method="get" action="/posts">
          <input
            name="q"
            defaultValue={query}
            placeholder="搜索标题、标签、摘要或正文内容"
            className="w-full max-w-xl rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
          <button
            type="submit"
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            搜索
          </button>
          {query ? (
            <Link
              href="/posts"
              className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm text-muted-fg transition-colors hover:text-foreground"
            >
              清除关键词
            </Link>
          ) : null}
        </form>
      </header>

      {paginatedPosts.length === 0 ? (
        <section className="glass-panel mt-8 rounded-[10px] p-8 text-center">
          <p className="text-base text-muted-fg">还没有可展示的文章。</p>
        </section>
      ) : (
        <ul className="mt-8 space-y-4">
          {paginatedPosts.map((post) => (
            <li key={post.slug}>
              <PostListCard post={post} />
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="文章分页" className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={getPageHref(Math.max(1, currentPage - 1), query)}
          aria-disabled={currentPage <= 1}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            currentPage <= 1
              ? "pointer-events-none border-border/40 text-muted-fg/45"
              : "border-border/70 bg-surface-soft text-muted-fg hover:text-foreground"
          }`}
        >
          上一页
        </Link>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
          const isCurrent = page === currentPage;
          return (
            <Link
              key={page}
              href={getPageHref(page, query)}
              aria-current={isCurrent ? "page" : undefined}
              className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                isCurrent
                  ? "border-accent/60 bg-accent/14 text-accent"
                  : "border-border/70 bg-surface-soft text-muted-fg hover:text-foreground"
              }`}
            >
              {page}
            </Link>
          );
        })}

        <Link
          href={getPageHref(Math.min(totalPages, currentPage + 1), query)}
          aria-disabled={currentPage >= totalPages}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            currentPage >= totalPages
              ? "pointer-events-none border-border/40 text-muted-fg/45"
              : "border-border/70 bg-surface-soft text-muted-fg hover:text-foreground"
          }`}
        >
          下一页
        </Link>
      </nav>

      <NewsletterSignupCard className="mt-8" />
    </div>
  );
}
