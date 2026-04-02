import type { Metadata } from "next";
import Link from "next/link";
import { SakurairoSiteAvatar } from "@/components/layout/SakurairoSiteAvatar";
import { mdxComponents } from "@/components/mdx/components";
import { siteConfig } from "@/config/site";
import { getMDXContent } from "@/lib/mdx";
import { getPageContentBySlug } from "@/lib/page-content";

export const metadata: Metadata = {
  title: "关于",
  description: `关于 ${siteConfig.author.name} 的介绍、技能与联系方式。`,
  alternates: {
    canonical: "/about",
  },
};

function getContactLinks() {
  const toGmailCompose = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("https://mail.google.com/")) return trimmed;

    let email = "";
    if (trimmed.startsWith("mailto:")) {
      email = trimmed.replace(/^mailto:/i, "").trim();
    } else if (trimmed.includes("@")) {
      email = trimmed;
    }

    if (email) {
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    }

    return trimmed;
  };

  const links = [];
  const { github, twitter, bilibili, xiaohongshu, neteaseMusic, steam, gmail, email } =
    siteConfig.author.social;
  if (github) links.push({ label: "GitHub", href: github });
  if (twitter) links.push({ label: "Twitter/X", href: twitter });
  if (bilibili) links.push({ label: "Bilibili", href: bilibili });
  if (xiaohongshu) links.push({ label: "小红书", href: xiaohongshu });
  if (neteaseMusic) links.push({ label: "网易云音乐", href: neteaseMusic });
  if (steam) links.push({ label: "Steam", href: steam });
  const gmailHref = toGmailCompose(gmail || email || "");
  if (gmailHref) links.push({ label: "Gmail", href: gmailHref });
  return links;
}

export default async function AboutPage() {
  const mdxSource = await getPageContentBySlug("about");
  const MDXContent = mdxSource ? await getMDXContent(mdxSource) : null;
  const contacts = getContactLinks();

  return (
    <div className="content-shell space-y-6 pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <SakurairoSiteAvatar
            fallbackSrc={siteConfig.author.avatar}
            alt={`${siteConfig.author.name} 头像`}
            width={120}
            height={120}
            className="h-24 w-24 rounded-3xl border border-border object-cover sm:h-[7.5rem] sm:w-[7.5rem]"
          />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-fg">About Me</p>
            <h1
              className="sakurairo-page-title mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl"
            >
              {siteConfig.author.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-fg sm:text-base">
              {siteConfig.author.bio}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <article className="glass-panel rounded-[10px] p-5 sm:p-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-fg">技能栈</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {siteConfig.author.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-[10px] p-5 sm:p-6">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-fg">联系方式</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {contacts.map((contact) => {
              const isMail = contact.href.startsWith("mailto:");
              return (
                <li key={contact.label}>
                  <Link
                    href={contact.href}
                    target={isMail ? undefined : "_blank"}
                    rel={isMail ? undefined : "noopener noreferrer"}
                    className="inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
                  >
                    {contact.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="glass-panel rounded-[10px] p-5 sm:p-6">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-fg">详细介绍</h2>
        {MDXContent ? (
          <div className="markdown-content prose prose-slate mt-4 max-w-none dark:prose-invert">
            <MDXContent components={mdxComponents} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-fg">
            还没有找到 about 页面内容文件，请在 `content/pages/about.mdx` 中补充。
          </p>
        )}
      </section>
    </div>
  );
}
