import Image from "next/image";
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

interface PostListCardProps {
  post: PostMeta;
  href?: string;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function PostListCard({ post, href }: PostListCardProps) {
  const target = href ?? `/posts/${post.slug}`;
  const hasCover = Boolean(post.cover);
  const tags = post.tags ?? [];
  const viewCountText =
    typeof post.viewCount === "number"
      ? `${post.viewCount.toLocaleString("zh-CN")} 次阅读`
      : "-- 次阅读";
  const maxVisibleTags = 4;
  const visibleTags = tags.slice(0, maxVisibleTags);
  const hasMoreTags = tags.length > maxVisibleTags;

  return (
    <article className="group relative h-44 overflow-hidden rounded-[10px] border border-border bg-surface shadow-[var(--shadow-soft)] md:flex md:h-40">
      <div className="absolute inset-0 z-0 overflow-hidden rounded-[10px]">
        {hasCover ? (
          <Image
            src={post.cover!}
            alt={`${post.title} 封面图`}
            fill
            sizes="(max-width: 860px) 100vw, 860px"
            className="object-cover blur-sm transition-all duration-500 group-hover:scale-110 group-hover:brightness-95 md:blur-xl"
          />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,rgba(164,205,246,0.6),rgba(255,255,255,0.9),rgba(164,205,246,0.55))] dark:bg-[linear-gradient(135deg,rgba(41,74,164,0.55),rgba(26,34,54,0.92),rgba(41,74,164,0.48))]" />
        )}
      </div>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.75),rgba(255,255,255,0.55),rgba(255,255,255,0.78))] dark:bg-[linear-gradient(to_bottom_right,rgba(22,31,47,0.78),rgba(22,31,47,0.55),rgba(22,31,47,0.8))]" />

      <Link
        href={target}
        aria-label={`阅读：${post.title}`}
        className="relative z-10 flex h-full w-full flex-col justify-between p-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-surface-soft px-2 py-1 text-xs text-muted-fg">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
            <span>·</span>
            <span>{viewCountText}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-7 text-foreground transition-colors group-hover:text-accent md:text-xl">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm leading-6 text-muted-fg">{post.description}</p>
        </div>

        {tags.length ? (
          <div className="mt-3 flex flex-nowrap items-center gap-1.5 overflow-hidden">
            {visibleTags.map((tag) => (
              <span
                key={`${post.slug}-${tag}`}
                className="max-w-[8.5rem] shrink-0 truncate rounded-full border border-border/70 bg-surface-soft px-2 py-0.5 text-xs text-muted-fg"
                title={`#${tag}`}
              >
                #{tag}
              </span>
            ))}
            {hasMoreTags ? (
              <span className="shrink-0 rounded-full border border-border/70 bg-surface-soft px-2 py-0.5 text-xs text-muted-fg">
                ...
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>

      {hasCover ? (
        <div className="relative z-[1] hidden w-[42%] overflow-hidden md:block">
          <Image
            src={post.cover!}
            alt={`${post.title} 封面图`}
            fill
            sizes="(max-width: 1024px) 30vw, 360px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-transparent transition-all duration-300 group-hover:ring-accent/35 group-hover:shadow-[var(--shadow-float)]"
      />
    </article>
  );
}
