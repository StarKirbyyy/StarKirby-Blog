import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostListCard } from "@/components/posts/PostListCard";
import { siteConfig } from "@/config/site";
import { getAllTags, getPostsByTag } from "@/lib/posts";

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

function decodeTag(tag: string) {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

export async function generateStaticParams() {
  const isDatabaseContentSource =
    (process.env.CONTENT_SOURCE ?? "").trim().toLowerCase() === "database";
  if (isDatabaseContentSource) {
    return [];
  }
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

  const [posts, allTags] = await Promise.all([getPostsByTag(decodedTag), getAllTags()]);

  if (posts.length === 0) {
    notFound();
  }

  const matchedTag =
    allTags.find((item) => item.tag.toLowerCase() === decodedTag.toLowerCase())?.tag ??
    decodedTag;

  return (
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <Link
          href="/tags"
          className="inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
        >
          ← 返回标签页
        </Link>
        <h1
          className={`${siteConfig.sakurairo.pageTitleAnimation ? "sakurairo-page-title " : ""}mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl`}
          style={{
            ["--sakurairo-title-duration" as string]: `${siteConfig.sakurairo.pageTitleAnimationDuration}s`,
          }}
        >
          #{matchedTag}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-fg">共 {posts.length} 篇文章。</p>
      </header>

      <ul className="mt-8 space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <PostListCard post={post} />
          </li>
        ))}
      </ul>
    </div>
  );
}
