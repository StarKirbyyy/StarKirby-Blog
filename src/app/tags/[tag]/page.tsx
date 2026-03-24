import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export const dynamicParams = false;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function decodeTag(tag: string) {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((item) => ({ tag: item.tag }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeTag(tag);

  return {
    title: `标签：${decoded}`,
    description: `查看标签「${decoded}」下的全部文章。`,
    alternates: {
      canonical: `/tags/${encodeURIComponent(decoded)}`,
    },
  };
}

export default async function TagDetailPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeTag(tag);

  const [posts, allTags] = await Promise.all([
    getPostsByTag(decodedTag),
    getAllTags(),
  ]);

  if (posts.length === 0) {
    notFound();
  }

  const matchedTag =
    allTags.find((item) => item.tag.toLowerCase() === decodedTag.toLowerCase())?.tag ??
    decodedTag;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <Link
          href="/tags"
          className="text-sm text-muted-fg transition-colors hover:text-accent"
        >
          ← 返回标签页
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          标签：#{matchedTag}
        </h1>
        <p className="mt-3 text-base text-muted-fg">
          共 {posts.length} 篇文章
        </p>
      </header>

      <ul className="mt-8 space-y-5">
        {posts.map((post) => (
          <li key={post.slug}>
            <article className="overflow-hidden rounded-xl border border-border bg-card">
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
                      {post.tags.map((postTag) => {
                        const href = `/tags/${encodeURIComponent(postTag)}`;
                        const isCurrent = postTag.toLowerCase() === matchedTag.toLowerCase();
                        return (
                          <Link
                            key={`${post.slug}-${postTag}`}
                            href={href}
                            className={`rounded-md px-2 py-1 text-xs transition-colors ${
                              isCurrent
                                ? "bg-accent/10 text-accent"
                                : "bg-muted text-muted-fg hover:text-accent"
                            }`}
                          >
                            #{postTag}
                          </Link>
                        );
                      })}
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
                      className="h-auto w-full"
                      unoptimized
                    />
                  </Link>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
