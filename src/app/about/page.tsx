import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
  const links = [];
  const { github, twitter, email } = siteConfig.author.social;
  if (github) links.push({ label: "GitHub", href: github });
  if (twitter) links.push({ label: "Twitter/X", href: twitter });
  if (email) links.push({ label: "Email", href: email });
  return links;
}

export default async function AboutPage() {
  const mdxSource = await getPageContentBySlug("about");
  const MDXContent = mdxSource ? await getMDXContent(mdxSource) : null;
  const contacts = getContactLinks();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Image
            src={siteConfig.author.avatar}
            alt={`${siteConfig.author.name} 头像`}
            width={104}
            height={104}
            sizes="104px"
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
          </div>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">技能栈</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {siteConfig.author.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-fg"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">联系方式</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {contacts.map((contact) => {
            const isMail = contact.href.startsWith("mailto:");
            return (
              <li key={contact.label}>
                <Link
                  href={contact.href}
                  target={isMail ? undefined : "_blank"}
                  rel={isMail ? undefined : "noopener noreferrer"}
                  className="inline-flex rounded-md border border-border px-3 py-2 text-sm text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
                >
                  {contact.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">详细介绍</h2>
        {MDXContent ? (
          <div className="prose prose-slate mt-4 max-w-none dark:prose-invert">
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
