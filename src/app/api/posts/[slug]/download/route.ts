import matter from "gray-matter";
import { getPostBySlug } from "@/lib/posts";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decodeSlugParam(slug: string) {
  const raw = slug.trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function sanitizeFilenamePart(input: string) {
  const normalized = input
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "post";
}

function toAsciiFilename(input: string) {
  const ascii = sanitizeFilenamePart(input)
    .replace(/[^\w.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || "post";
}

function buildMarkdownDownload(post: Awaited<ReturnType<typeof getPostBySlug>>) {
  if (!post) return "";

  const frontmatter: Record<string, unknown> = {
    title: post.title,
    description: post.description,
    date: post.date,
    slug: post.slug,
  };

  if (post.updated) {
    frontmatter.updated = post.updated;
  }
  if (post.tags?.length) {
    frontmatter.tags = post.tags;
  }
  if (post.cover) {
    frontmatter.cover = post.cover;
  }
  if (post.draft) {
    frontmatter.draft = post.draft;
  }

  const source = matter.stringify(post.content.replace(/^\uFEFF/, ""), frontmatter);
  return source.endsWith("\n") ? source : `${source}\n`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug: rawSlug } = await context.params;
  const slug = decodeSlugParam(rawSlug || "");
  if (!slug) {
    return new Response("Invalid post slug", { status: 400 });
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    return new Response("Post not found", { status: 404 });
  }

  const markdown = buildMarkdownDownload(post);
  const unicodeFilename = `${sanitizeFilenamePart(post.slug)}.md`;
  const asciiFilename = `${toAsciiFilename(post.slug)}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(
        unicodeFilename,
      )}`,
      "Cache-Control": "no-store",
    },
  });
}
