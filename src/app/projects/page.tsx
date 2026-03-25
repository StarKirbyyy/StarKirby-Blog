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
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          项目
        </h1>
        <p className="mt-3 text-base text-muted-fg">
          这里收录我正在维护或重点投入的项目。
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-base text-muted-fg">项目列表还在整理中。</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.name}>
              <article className="card-hover h-full rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-fg">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={`${project.name}-${tech}`}
                      className="rounded-md bg-muted px-2 py-1 text-xs text-muted-fg"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {project.github ? (
                    <Link
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-border px-3 py-2 text-sm text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
                    >
                      GitHub
                    </Link>
                  ) : null}
                  {project.demo ? (
                    <Link
                      href={project.demo}
                      target={project.demo.startsWith("/") ? undefined : "_blank"}
                      rel={project.demo.startsWith("/") ? undefined : "noopener noreferrer"}
                      className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent transition-colors hover:bg-accent/20"
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
