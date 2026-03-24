import { Feed } from "feed";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/url";

export const revalidate = 3600;

function toValidDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

export async function GET() {
  const posts = await getAllPosts();
  const siteUrl = getSiteUrl();

  const feed = new Feed({
    title: siteConfig.rss.title,
    description: siteConfig.rss.description,
    id: siteUrl,
    link: siteUrl,
    language: siteConfig.locale,
    favicon: toAbsoluteUrl("/favicon.ico"),
    copyright: `© ${new Date().getFullYear()} ${siteConfig.author.name}`,
    updated:
      posts.length > 0 ? toValidDate(posts[0].updated ?? posts[0].date) : new Date(),
    feedLinks: {
      rss2: toAbsoluteUrl("/rss.xml"),
    },
    author: {
      name: siteConfig.author.name,
      link: siteUrl,
    },
  });

  for (const post of posts) {
    const link = toAbsoluteUrl(`/posts/${encodeURIComponent(post.slug)}`);
    feed.addItem({
      title: post.title,
      id: link,
      link,
      description: post.description,
      date: toValidDate(post.updated ?? post.date),
      category: (post.tags ?? []).map((tag) => ({ name: tag })),
      image: post.cover ? toAbsoluteUrl(post.cover) : toAbsoluteUrl(siteConfig.ogImage),
      author: [{ name: siteConfig.author.name, link: siteUrl }],
    });
  }

  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
