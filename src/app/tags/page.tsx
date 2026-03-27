import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getAllTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "标签",
  description: "按标签浏览 StarKirby Blog 文章。",
  alternates: {
    canonical: "/tags",
  },
};

export const revalidate = 3600;

function getTagStyle(count: number, minCount: number, maxCount: number) {
  if (maxCount === minCount) {
    return { fontSize: "1rem", opacity: 0.95 };
  }

  const ratio = (count - minCount) / (maxCount - minCount);
  const fontSize = 0.92 + ratio * 0.48;
  const opacity = 0.72 + ratio * 0.28;

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
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">Taxonomy</p>
        <h1
          className="sakurairo-page-title mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl"
        >
          标签云
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-fg">共 {tags.length} 个标签，点击即可进入标签归档页。</p>
      </header>

      {tags.length === 0 ? (
        <section className="glass-panel mt-8 rounded-[10px] p-8 text-center">
          <p className="text-base text-muted-fg">还没有可展示的标签。</p>
        </section>
      ) : (
        <ul className="glass-panel mt-8 flex flex-wrap gap-3 rounded-[10px] p-5 sm:p-6">
          {tags.map((item) => (
            <li key={item.tag}>
              <Link
                href={`/tags/${encodeURIComponent(item.tag)}`}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-muted-fg transition-colors hover:border-accent/40 hover:text-accent"
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
