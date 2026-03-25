import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

interface PostsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "文章",
  description: "StarKirby Blog 的全部文章列表。",
  alternates: {
    canonical: "/posts",
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function parsePageNumber(input?: string) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 1;
  const page = Math.trunc(parsed);
  return page > 0 ? page : 1;
}

function getPageHref(page: number) {
  return page === 1 ? "/posts" : `/posts?page=${page}`;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const [{ page: rawPage }, allPosts] = await Promise.all([
    searchParams,
    getAllPosts(),
  ]);

  const postsPerPage = siteConfig.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(allPosts.length / postsPerPage));
  const currentPage = Math.min(parsePageNumber(rawPage), totalPages);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = allPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          全部文章
        </h1>
        <p className="mt-3 text-base text-muted-fg">
          共 {allPosts.length} 篇，当前第 {currentPage} / {totalPages} 页
        </p>
      </header>

      {paginatedPosts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-base text-muted-fg">还没有可展示的文章。</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {paginatedPosts.map((post) => (
            <li key={post.slug}>
              <article className="card-hover overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-[1fr_180px] md:items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="transition-colors hover:text-accent"
                      >
                        {post.title}
                      </Link>
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-fg">
                      <span>{formatDate(post.date)}</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-fg">
                      {post.description}
                    </p>
                    {post.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Link
                            key={`${post.slug}-${tag}`}
                            href={`/tags/${encodeURIComponent(tag)}`}
                            className="rounded-md bg-muted px-2 py-1 text-xs text-muted-fg transition-colors hover:text-accent"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {post.cover ? (
                    <Link
                      href={`/posts/${post.slug}`}
                      className="block overflow-hidden rounded-lg border border-border"
                    >
                      <Image
                        src={post.cover}
                        alt={`${post.title} 封面图`}
                        width={360}
                        height={200}
                        sizes="(min-width: 768px) 180px, 100vw"
                        className="h-auto w-full"
                      />
                    </Link>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <nav
        aria-label="文章分页"
        className="mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        <Link
          href={getPageHref(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage <= 1}
          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
            currentPage <= 1
              ? "pointer-events-none border-border/60 text-muted-fg/50"
              : "border-border text-muted-fg hover:text-foreground hover:bg-muted"
          }`}
        >
          上一页
        </Link>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
          const isCurrent = page === currentPage;
          return (
            <Link
              key={page}
              href={getPageHref(page)}
              aria-current={isCurrent ? "page" : undefined}
              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                isCurrent
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-fg hover:text-foreground hover:bg-muted"
              }`}
            >
              {page}
            </Link>
          );
        })}

        <Link
          href={getPageHref(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage >= totalPages}
          className={`rounded-md border px-3 py-2 text-sm transition-colors ${
            currentPage >= totalPages
              ? "pointer-events-none border-border/60 text-muted-fg/50"
              : "border-border text-muted-fg hover:text-foreground hover:bg-muted"
          }`}
        >
          下一页
        </Link>
      </nav>
    </div>
  );
}
