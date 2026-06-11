import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

type HomePostThumbCardProps = {
  post: PostMeta;
};

function formatDate(input: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(input));
}

export function HomePostThumbCard({ post }: HomePostThumbCardProps) {
  const downloadHref = `/api/posts/${encodeURIComponent(post.slug)}/download`;
  const viewCountText =
    typeof post.viewCount === "number"
      ? `浏览量 ${post.viewCount.toLocaleString("zh-CN")}`
      : "浏览量 --";
  const commentCountText = `评论数 ${(post.commentCount ?? 0).toLocaleString("zh-CN")}`;
  const wordCountText =
    typeof post.wordCount === "number"
      ? `字数 ${post.wordCount.toLocaleString("zh-CN")}`
      : "字数 --";
  const readingTimeText = `阅读 ${post.readingTime}`;

  return (
    <article className="post post-list-thumb">
      <Link
        href={`/posts/${encodeURIComponent(post.slug)}`}
        aria-label={`阅读：${post.title}`}
        className="post-card-link"
      >
        <div className="post-card-cover">
          <div className="post-thumb">
            {post.cover ? (
              <Image
                src={post.cover}
                alt={`${post.title} 封面图`}
                fill
                sizes="(max-width: 860px) 100vw, 860px"
                className="post-thumb-image"
              />
            ) : (
              <div className="post-thumb-fallback" />
            )}
          </div>
          <div className="post-card-cover-mask" />

          <div className="post-date">发布于 {formatDate(post.date)}</div>

          <div className="post-meta">
            <span>{viewCountText}</span>
            <span className="post-meta-separator">|</span>
            <span>{commentCountText}</span>
            <span className="post-meta-separator">|</span>
            <span>{wordCountText}</span>
            <span className="post-meta-separator">|</span>
            <span>{readingTimeText}</span>
          </div>

        </div>

        <div className="post-floating-title">{post.title}</div>

        <div className="post-excerpt">
          <p>{post.description}</p>
        </div>
      </Link>

      <a
        href={downloadHref}
        download
        aria-label={`下载 Markdown：${post.title}`}
        title="下载 Markdown"
        className="absolute bottom-4 right-4 z-[7] inline-flex h-8 items-center rounded-full border border-white/65 bg-white/78 px-3 text-xs font-medium text-black/80 shadow-sm backdrop-blur transition-colors hover:border-white hover:text-accent focus:outline-none focus:ring-2 focus:ring-white/55 dark:border-white/25 dark:bg-black/56 dark:text-white/90 dark:hover:text-accent"
      >
        下载 MD
      </a>
    </article>
  );
}
