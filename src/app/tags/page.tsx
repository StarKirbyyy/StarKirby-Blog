import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "标签",
  description: "按标签浏览 StarKirby Blog 文章。",
  alternates: {
    canonical: "/tags",
  },
};

function getTagStyle(count: number, minCount: number, maxCount: number) {
  if (maxCount === minCount) {
    return { fontSize: "1rem", opacity: 0.95 };
  }

  const ratio = (count - minCount) / (maxCount - minCount);
  const fontSize = 0.9 + ratio * 0.5;
  const opacity = 0.75 + ratio * 0.25;

  return {
    fontSize: `${fontSize.toFixed(2)}rem`,
    opacity,
  };
}

export default async function TagsPage() {
  const tags = await getAllTags();
  const counts = tags.map((item) => item.count);
  const minCount = counts.length > 0 ? Math.min(...counts) : 0;
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          标签
        </h1>
        <p className="mt-3 text-base text-muted-fg">
          共 {tags.length} 个标签，点击标签查看对应文章。
        </p>
      </header>

      {tags.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-base text-muted-fg">还没有可展示的标签。</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-wrap gap-3">
          {tags.map((item) => (
            <li key={item.tag}>
              <Link
                href={`/tags/${encodeURIComponent(item.tag)}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-muted-fg transition-colors hover:text-accent hover:border-accent/40"
                style={getTagStyle(item.count, minCount, maxCount)}
              >
                <span>#{item.tag}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-fg">
                  {item.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
