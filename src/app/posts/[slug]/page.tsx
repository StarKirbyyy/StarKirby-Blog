import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mdxComponents } from "@/components/mdx/components";
import { TableOfContents } from "@/components/posts/TableOfContents";
import { siteConfig } from "@/config/site";
import { getMDXContent } from "@/lib/mdx";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { extractTableOfContents } from "@/lib/toc";
import { toAbsoluteUrl } from "@/lib/url";

interface PageProps {
  params: Promise<{
    slug: string;
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

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "文章不存在",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const postUrl = toAbsoluteUrl(`/posts/${encodeURIComponent(post.slug)}`);
  const ogImageUrl = toAbsoluteUrl(
    `/posts/${encodeURIComponent(post.slug)}/opengraph-image`,
  );

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/posts/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: postUrl,
      title: post.title,
      description: post.description,
      siteName: siteConfig.name,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImageUrl],
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [allPosts, MDXContent] = await Promise.all([
    getAllPosts(),
    getMDXContent(post.content),
  ]);

  const toc = extractTableOfContents(post.content);
  const currentIndex = allPosts.findIndex((item) => item.slug === post.slug);
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;
  const postUrl = toAbsoluteUrl(`/posts/${encodeURIComponent(post.slug)}`);
  const ogImageUrl = toAbsoluteUrl(
    `/posts/${encodeURIComponent(post.slug)}/opengraph-image`,
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    image: [post.cover ? toAbsoluteUrl(post.cover) : ogImageUrl],
    keywords: post.tags?.join(", "),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/posts"
        className="text-sm text-muted-fg transition-colors hover:text-accent"
      >
        ← 返回文章列表
      </Link>

      <header className="mt-5 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-base text-muted-fg">{post.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-fg">
          <span>发布于 {formatDate(post.date)}</span>
          {post.updated ? <span>更新于 {formatDate(post.updated)}</span> : null}
          <span>{post.readingTime}</span>
          {post.tags?.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="rounded-md bg-muted px-2 py-1 text-xs text-muted-fg transition-colors hover:text-accent"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {post.cover ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <Image
            src={post.cover}
            alt={`${post.title} 封面图`}
            width={1200}
            height={630}
            className="h-auto w-full"
            priority
            unoptimized
          />
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
        <article className="min-w-0">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <MDXContent components={mdxComponents} />
          </div>

          <nav
            aria-label="文章导航"
            className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"
          >
            <div className="min-h-20 rounded-lg border border-border p-4">
              {olderPost ? (
                <Link
                  href={`/posts/${olderPost.slug}`}
                  className="text-sm text-muted-fg transition-colors hover:text-accent"
                >
                  ← 上一篇
                  <p className="mt-1 text-base font-medium text-foreground">
                    {olderPost.title}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-muted-fg">没有更早的文章了</p>
              )}
            </div>
            <div className="min-h-20 rounded-lg border border-border p-4 text-right">
              {newerPost ? (
                <Link
                  href={`/posts/${newerPost.slug}`}
                  className="text-sm text-muted-fg transition-colors hover:text-accent"
                >
                  下一篇 →
                  <p className="mt-1 text-base font-medium text-foreground">
                    {newerPost.title}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-muted-fg">已经是最新文章</p>
              )}
            </div>
          </nav>
        </article>

        <aside className="hidden lg:block">
          <TableOfContents items={toc} />
        </aside>
      </div>
    </div>
  );
}
