import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { PostListCard } from "@/components/posts/PostListCard";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "首页",
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export const revalidate = 3600;

type SocialItem = {
  label: string;
  href: string;
};

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
    <div className="content-shell space-y-8 pb-10 pt-5 sm:pt-7">
      <HomeHero
        title={siteConfig.title}
        subtitle={siteConfig.description}
        postsCount={allPosts.length}
      />

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="glass-panel rounded-[10px] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Image
              src={siteConfig.author.avatar}
              alt={`${siteConfig.author.name} 头像`}
              width={108}
              height={108}
              sizes="108px"
              className="h-24 w-24 rounded-3xl border border-border sm:h-28 sm:w-28"
              priority
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {siteConfig.author.name}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-fg sm:text-base">
                {siteConfig.author.bio}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
              >
                <SocialIcon label={item.label} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-[10px] p-5 sm:p-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-fg">
            Skill Stack
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-fg">
            近期主要聚焦在前端工程化、内容平台构建与 AI 辅助开发流程。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {siteConfig.author.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border/70 bg-surface-soft px-3 py-1 text-xs text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href="/about"
              className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              了解更多
            </Link>
            <Link
              href="/projects"
              className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
            >
              查看项目
            </Link>
          </div>
        </article>
      </section>

      <section id="home-latest" className="scroll-mt-28">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            最新文章
          </h2>
          <Link
            href="/posts"
            className="inline-flex items-center rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm font-medium text-muted-fg transition-colors hover:text-foreground"
          >
            查看全部文章
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <div className="glass-panel rounded-[10px] p-7 text-center">
            <p className="text-sm text-muted-fg">还没有发布文章，稍后再来看看。</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {latestPosts.map((post) => (
              <li key={post.slug}>
                <PostListCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
