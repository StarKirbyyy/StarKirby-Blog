import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "项目",
  description: `${siteConfig.author.name} 的项目展示页。`,
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsPage() {
  const projects = [...siteConfig.projects];

  return (
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-fg">Portfolio</p>
        <h1
          className={`${siteConfig.sakurairo.pageTitleAnimation ? "sakurairo-page-title " : ""}mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl`}
          style={{
            ["--sakurairo-title-duration" as string]: `${siteConfig.sakurairo.pageTitleAnimationDuration}s`,
          }}
        >
          项目
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-fg">
          这里收录我正在维护或重点投入的项目。
        </p>
      </header>

      {projects.length === 0 ? (
        <section className="glass-panel mt-8 rounded-[10px] p-8 text-center">
          <p className="text-base text-muted-fg">项目列表还在整理中。</p>
        </section>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.name}>
              <article className="glass-panel card-hover h-full rounded-[10px] p-5">
                <h2 className="text-xl font-semibold text-foreground">{project.name}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-fg">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={`${project.name}-${tech}`}
                      className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1 text-xs text-muted-fg"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {project.github ? (
                    <Link
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border/70 bg-surface-soft px-3.5 py-2 text-sm text-muted-fg transition-colors hover:text-foreground"
                    >
                      GitHub
                    </Link>
                  ) : null}
                  {project.demo ? (
                    <Link
                      href={project.demo}
                      target={project.demo.startsWith("/") ? undefined : "_blank"}
                      rel={project.demo.startsWith("/") ? undefined : "noopener noreferrer"}
                      className="rounded-full bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
                    >
                      访问项目
                    </Link>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
