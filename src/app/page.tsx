import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "首页",
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

type SocialItem = {
  label: string;
  href: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function getSocialItems(): SocialItem[] {
  const items: SocialItem[] = [];
  const { github, twitter, email } = siteConfig.author.social;
  if (github) items.push({ label: "GitHub", href: github });
  if (twitter) items.push({ label: "Twitter/X", href: twitter });
  if (email) items.push({ label: "Email", href: email });
  return items;
}

function SocialIcon({ label }: { label: string }) {
  if (label === "GitHub") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    );
  }
  if (label === "Email") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 4s-4.2 1.7-6.1 2c-1.2-1.3-3-2-4.9-2A6.7 6.7 0 0 0 4 10.9V12A16 16 0 0 1 2 3s-4 9 5 13c-2 .7-4 1-6 1 9 5 20 0 20-11v-.5c1.7-1.2 1-1.5 1-1.5Z" />
    </svg>
  );
}

export default async function HomePage() {
  const [allPosts] = await Promise.all([getAllPosts()]);
  const latestPosts = allPosts.slice(0, siteConfig.latestPostsCount);
  const socialItems = getSocialItems();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Image
            src={siteConfig.author.avatar}
            alt={`${siteConfig.author.name} 头像`}
            width={96}
            height={96}
            sizes="96px"
            className="h-24 w-24 rounded-2xl border border-border"
            priority
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {siteConfig.author.name}
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-fg">
              {siteConfig.author.bio}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {socialItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
                >
                  <SocialIcon label={item.label} />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">最新文章</h2>
          <Link
            href="/posts"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            查看全部文章 →
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-fg">还没有发布文章，稍后再来看看。</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {latestPosts.map((post) => (
              <li key={post.slug}>
                <article className="card-hover rounded-xl border border-border bg-card p-5">
                  <h3 className="text-lg font-semibold text-foreground">
                    <Link
                      href={`/posts/${post.slug}`}
                      className="transition-colors hover:text-accent"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-fg">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-fg">
                    {post.description}
                  </p>
                  {post.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={`${post.slug}-${tag}`}
                          href={`/tags/${encodeURIComponent(tag)}`}
                          className="rounded-md bg-muted px-2 py-1 text-xs text-muted-fg transition-colors hover:text-accent"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
