import matter from "gray-matter";
import { upsertRepoFile } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "avif", "gif", "svg"]);
const POST_EXTENSIONS = new Set(["md", "mdx"]);

function sanitizeSlug(input: string) {
  const withoutExt = input.replace(/\.mdx?$/i, "");
  const slug = withoutExt
    .trim()
    .toLowerCase()
    .replace(/[\/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `post-${Date.now()}`;
}

function getExtension(filename: string) {
  const matched = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return matched?.[1] || "";
}

function normalizePostContent(content: string, slug: string, coverPath?: string) {
  const parsed = matter(content);
  const frontmatter = { ...(parsed.data as Record<string, unknown>) };
  frontmatter.slug = slug;
  if (coverPath) {
    frontmatter.cover = coverPath;
  }
  return matter.stringify(parsed.content, frontmatter);
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateFrontmatter(rawData: unknown) {
  const data = (rawData ?? {}) as Record<string, unknown>;

  if (typeof data.title !== "string" || !data.title.trim()) {
    return "Frontmatter 缺少必填字段: title";
  }
  if (typeof data.description !== "string" || !data.description.trim()) {
    return "Frontmatter 缺少必填字段: description";
  }
  if (typeof data.date !== "string" || !data.date.trim()) {
    return "Frontmatter 缺少必填字段: date";
  }
  if (!isValidDateString(data.date.trim())) {
    return "Frontmatter 字段 date 格式错误，需为 YYYY-MM-DD";
  }

  return null;
}

function getApiKeyFromForm(formData: FormData) {
  const value = formData.get("apiKey");
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const expectedApiKey = process.env.PUBLISH_API_KEY?.trim();
    if (!expectedApiKey) {
      return Response.json(
        { error: "Missing environment variable: PUBLISH_API_KEY" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const providedApiKey = getApiKeyFromForm(formData);
    if (providedApiKey !== expectedApiKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const markdownFile = formData.get("postFile");
    if (!(markdownFile instanceof File)) {
      return Response.json({ error: "Missing markdown file" }, { status: 400 });
    }

    const markdownExt = getExtension(markdownFile.name);
    if (!POST_EXTENSIONS.has(markdownExt)) {
      return Response.json(
        { error: "Markdown file must be .md or .mdx" },
        { status: 400 },
      );
    }

    const markdownSource = await markdownFile.text();
    const parsed = matter(markdownSource);
    const frontmatterError = validateFrontmatter(parsed.data);
    if (frontmatterError) {
      return Response.json({ error: frontmatterError }, { status: 400 });
    }

    const customSlug = formData.get("slug");
    const rawSlug =
      (typeof customSlug === "string" && customSlug.trim()) ||
      markdownFile.name.replace(/\.[^.]+$/, "");
    const slug = sanitizeSlug(rawSlug);

    let coverPath: string | undefined;
    const coverFile = formData.get("coverFile");
    if (coverFile instanceof File && coverFile.size > 0) {
      const coverExt = getExtension(coverFile.name);
      if (!IMAGE_EXTENSIONS.has(coverExt)) {
        return Response.json(
          { error: "Cover image must be png/jpg/jpeg/webp/avif/gif/svg" },
          { status: 400 },
        );
      }

      coverPath = `/images/covers/${slug}-${Date.now()}.${coverExt}`;
      const coverRepoPath = `public${coverPath}`;
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());

      await upsertRepoFile({
        path: coverRepoPath,
        content: coverBuffer,
        message: `chore(content): upload cover for ${slug}`,
      });
    }

    const normalizedMarkdown = normalizePostContent(markdownSource, slug, coverPath);
    const markdownRepoPath = `content/posts/${slug}.${markdownExt}`;

    await upsertRepoFile({
      path: markdownRepoPath,
      content: Buffer.from(normalizedMarkdown, "utf8"),
      message: `feat(content): publish post ${slug}`,
    });

    return Response.json({
      success: true,
      slug,
      postPath: markdownRepoPath,
      coverPath: coverPath ?? null,
      postUrl: `/posts/${slug}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to publish post";
    return Response.json({ error: message }, { status: 500 });
  }
}
