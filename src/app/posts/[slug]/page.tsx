import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { mdxComponents } from "@/components/mdx/components";
import { CommentsSection } from "@/components/posts/CommentsSection";
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

export const dynamicParams = true;
export const revalidate = 3600;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export async function generateStaticParams() {
  const isDatabaseContentSource =
    (process.env.CONTENT_SOURCE ?? "").trim().toLowerCase() === "database";
  if (isDatabaseContentSource) {
    return [];
  }
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

  const [allPosts, MDXContent] = await Promise.all([getAllPosts(), getMDXContent(post.content)]);

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
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <Script
        id={`post-jsonld-${post.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>

      {post.cover ? (
        <header className="relative h-[320px] overflow-hidden rounded-[10px] border border-border shadow-[var(--shadow-soft)] sm:h-[380px]">
          <Image
            src={post.cover}
            alt={`${post.title} 封面图`}
            fill
            sizes="(max-width: 860px) 100vw, 860px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-black/58" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <Link
              href="/posts"
              className="inline-flex rounded-full border border-white/35 bg-white/16 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/24"
            >
              ← 返回文章列表
            </Link>
            <h1
              className="sakurairo-page-title sakurairo-post-title-underline relative mt-4 font-medium tracking-tight text-white after:absolute after:bottom-[-2px] after:left-0 after:h-[0.4em] after:w-[68%] after:rounded-full after:bg-white/35 after:content-['']"
              style={{
                fontSize: "clamp(2rem,4vw,var(--sakurairo-post-title-size,34px))",
              }}
            >
              {post.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/92 sm:text-base">
              {post.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/90 sm:text-sm">
              <span className="post-meta-chip">发布于 {formatDate(post.date)}</span>
              {post.updated ? (
                <span className="post-meta-chip">更新于 {formatDate(post.updated)}</span>
              ) : null}
              <span className="post-meta-chip">{post.readingTime}</span>
            </div>
          </div>
        </header>
      ) : (
        <header className="glass-panel overflow-hidden rounded-[10px] p-6 sm:p-7">
          <Link
            href="/posts"
            className="inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
          >
            ← 返回文章列表
          </Link>
          <h1
            className="sakurairo-page-title sakurairo-post-title-underline relative mt-4 font-semibold tracking-tight text-foreground after:absolute after:bottom-[-4px] after:left-[8%] after:h-[0.5em] after:w-[72%] after:rounded-full after:bg-accent/35 after:content-['']"
            style={{
              fontSize: "clamp(2rem,4vw,var(--sakurairo-post-title-size,34px))",
            }}
          >
            {post.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-fg sm:text-base">
            {post.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-muted-fg sm:text-sm">
            <span className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5">
              发布于 {formatDate(post.date)}
            </span>
            {post.updated ? (
              <span className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5">
                更新于 {formatDate(post.updated)}
              </span>
            ) : null}
            <span className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5">
              {post.readingTime}
            </span>
          </div>
        </header>
      )}

      {post.tags?.length ? (
        <div className="sakurairo-post-tags mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1 text-xs text-muted-fg transition-colors hover:text-accent"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 space-y-6">
          <div className="glass-panel rounded-[10px] p-5 sm:p-7">
            <div className="markdown-content prose prose-slate max-w-none dark:prose-invert">
              <MDXContent components={mdxComponents} />
            </div>
          </div>

          <nav aria-label="文章导航" className="sakurairo-post-navigation grid gap-3 sm:grid-cols-2">
            <div className="glass-panel card-hover min-h-24 rounded-[10px] p-4">
              {olderPost ? (
                <Link href={`/posts/${olderPost.slug}`} className="block">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-fg">上一篇</p>
                  <p className="mt-2 text-base font-medium text-foreground transition-colors hover:text-accent">
                    {olderPost.title}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-muted-fg">没有更早的文章了</p>
              )}
            </div>
            <div className="glass-panel card-hover min-h-24 rounded-[10px] p-4 text-right">
              {newerPost ? (
                <Link href={`/posts/${newerPost.slug}`} className="block">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-fg">下一篇</p>
                  <p className="mt-2 text-base font-medium text-foreground transition-colors hover:text-accent">
                    {newerPost.title}
                  </p>
                </Link>
              ) : (
                <p className="text-sm text-muted-fg">已经是最新文章</p>
              )}
            </div>
          </nav>

          <CommentsSection postSlug={post.slug} />
        </article>

        <aside className="sakurairo-post-toc hidden lg:block">
          <TableOfContents items={toc} />
        </aside>
      </div>
    </div>
  );
}
