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
  const primaryTag = post.tags?.[0];

  return (
    <article className="post post-list-thumb">
      <div className="post-thumb">
        <Link href={`/posts/${post.slug}`} aria-label={`阅读：${post.title}`}>
          {post.cover ? (
            <Image
              src={post.cover}
              alt={`${post.title} 封面图`}
              fill
              sizes="(max-width: 860px) 100vw, 860px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,rgba(164,205,246,0.6),rgba(255,255,255,0.86),rgba(164,205,246,0.55))] dark:bg-[linear-gradient(135deg,rgba(41,74,164,0.55),rgba(26,34,54,0.92),rgba(41,74,164,0.45))]" />
          )}
        </Link>
      </div>

      <div className="post-date">
        <i>◷</i>发布于 {formatDate(post.date)}
      </div>

      <div className="post-meta">
        <span>
          <i>#</i>
          {primaryTag ? primaryTag : "未分类"}
        </span>
        <span>
          <i>⌛</i>
          {post.readingTime}
        </span>
      </div>

      <div className="post-title">
        <Link href={`/posts/${post.slug}`}>
          <h3>{post.title}</h3>
        </Link>
      </div>

      <div className="post-excerpt">
        <div className="ai-excerpt-tip">摘要</div>
        <p>{post.description}</p>
      </div>
    </article>
  );
}
