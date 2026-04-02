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
    </article>
  );
}
