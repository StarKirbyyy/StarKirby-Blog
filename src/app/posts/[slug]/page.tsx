import type { Metadata } from "next";
import type { ComponentPropsWithoutRef } from "react";
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

type ParagraphProps = ComponentPropsWithoutRef<"p">;
type ListItemProps = ComponentPropsWithoutRef<"li">;

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
  const currentMeta = currentIndex >= 0 ? allPosts[currentIndex] : null;
  const newerPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;
  const readCountText =
    typeof currentMeta?.viewCount === "number"
      ? currentMeta.viewCount.toLocaleString("zh-CN")
      : "--";
  const tocItems = [{ id: "post-top", text: post.title, level: 1 as const }, ...toc];
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
  const postMdxComponents = {
    ...mdxComponents,
    p: ({ className, ...props }: ParagraphProps) => (
      <p
        className={["post-reading-text", className].filter(Boolean).join(" ")}
        {...props}
      />
    ),
    li: ({ className, ...props }: ListItemProps) => (
      <li
        className={["post-reading-text", className].filter(Boolean).join(" ")}
        {...props}
      />
    ),
  };

  return (
    <div className="-mt-[4.5rem] pb-10 sm:-mt-24 sm:pb-12">
      <Script
        id={`post-jsonld-${post.slug}`}
        type="application/ld+json"
        strategy="beforeInteractive"
      >
        {JSON.stringify(jsonLd)}
      </Script>

      <span id="post-top" className="sr-only" />

      <header className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden border-b border-white/20">
        <div className="relative h-[290px] sm:h-[360px] lg:h-[420px]">
          {post.cover ? (
            <Image
              src={post.cover}
              alt={`${post.title} 封面图`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(70,167,244,0.76),rgba(22,64,129,0.86),rgba(17,37,86,0.92))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/52" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="content-shell pb-8 sm:pb-10">
              <h1
                data-post-title={post.title}
                className="sakurairo-page-title sakurairo-post-title-underline relative max-w-4xl font-medium tracking-tight text-white after:absolute after:bottom-[-2px] after:left-0 after:h-[0.38em] after:w-[68%] after:rounded-full after:bg-white/30 after:content-['']"
                style={{
                  fontSize: "clamp(2rem,4vw,var(--sakurairo-post-title-size,34px))",
                }}
              >
                {post.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-white/92 sm:text-base">
                <span>发布于 {formatDate(post.date)}</span>
                <span>·</span>
                <span>{readCountText} 次阅读</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto mt-6 w-full max-w-[1500px] px-4 sm:mt-8 sm:px-6">
        <div className="mx-auto w-full max-w-[900px]">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/posts"
              className="inline-flex px-1 py-1 text-muted-fg transition-colors hover:text-foreground"
            >
              ← 返回文章列表
            </Link>
            {post.tags?.length ? (
              <div className="sakurairo-post-tags flex flex-wrap gap-2">
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
          </div>

          <article className="min-w-0 space-y-6">
            <div className="px-1 sm:px-2">
              <div className="markdown-content prose prose-slate max-w-none dark:prose-invert">
                <MDXContent components={postMdxComponents} />
              </div>
            </div>

            <nav aria-label="文章导航" className="sakurairo-post-navigation grid w-full gap-3 sm:grid-cols-2">
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

            <div className="w-full">
              <CommentsSection postSlug={post.slug} />
            </div>
          </article>
        </div>

        <aside className="sakurairo-post-toc absolute left-1/2 top-0 bottom-0 ml-[500px] hidden w-[280px] xl:block">
          <TableOfContents items={tocItems} />
        </aside>
      </div>
    </div>
  );
}
