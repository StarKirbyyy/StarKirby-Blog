import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import readingTime from "reading-time";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import { uploadToOss } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "avif", "gif", "svg"]);
const POST_EXTENSIONS = new Set(["md", "mdx"]);

type PublishSupplement = {
  title?: string;
  description?: string;
  tags?: string;
  date?: string;
};

type NormalizedPostData = {
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  draft: boolean;
  readingTime: string;
  markdownBody: string;
};

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

function getImageContentType(ext: string) {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function getTodayDateString() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function stripFrontmatter(source: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return normalized;
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return normalized;
  }
  return normalized.slice(end + 5);
}

function extractTitleFromMarkdown(source: string) {
  const content = stripFrontmatter(source);
  const lines = content.split(/\r?\n/);
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) {
      continue;
    }
    const matched = line.match(/^#\s+(.+?)\s*$/);
    if (matched) {
      return matched[1].trim();
    }
  }

  return undefined;
}

function trimToText(input: string) {
  return input
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDescriptionFromMarkdown(source: string) {
  const content = stripFrontmatter(source);
  const lines = content.split(/\r?\n/);
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence || !line) {
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) {
      continue;
    }
    const plain = trimToText(line);
    if (!plain) {
      continue;
    }
    return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
  }

  return "暂无描述";
}

function toNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseTagsInput(value: string | undefined) {
  if (!value) {
    return undefined;
  }
  const tags = value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (tags.length === 0) {
    return undefined;
  }
  return Array.from(new Set(tags));
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    const tags = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
  }
  if (typeof value === "string") {
    return parseTagsInput(value);
  }
  return undefined;
}

function normalizePostContent(
  content: string,
  slug: string,
  supplement: PublishSupplement,
  coverUrl?: string,
) {
  const parsed = matter(content);
  const frontmatter = { ...(parsed.data as Record<string, unknown>) };

  const markdownTitle = extractTitleFromMarkdown(content);
  frontmatter.title =
    toNonEmptyString(frontmatter.title) ??
    supplement.title ??
    markdownTitle ??
    slug;

  frontmatter.description =
    toNonEmptyString(frontmatter.description) ??
    supplement.description ??
    extractDescriptionFromMarkdown(content);

  const frontmatterDate = toNonEmptyString(frontmatter.date);
  if (frontmatterDate && isValidDateString(frontmatterDate)) {
    frontmatter.date = frontmatterDate;
  } else if (supplement.date && isValidDateString(supplement.date)) {
    frontmatter.date = supplement.date;
  } else {
    frontmatter.date = getTodayDateString();
  }

  const frontmatterTags = normalizeTags(frontmatter.tags);
  const formTags = parseTagsInput(supplement.tags);
  const tags = frontmatterTags ?? formTags;
  if (tags && tags.length > 0) {
    frontmatter.tags = tags;
  } else {
    delete frontmatter.tags;
  }

  frontmatter.slug = slug;
  if (coverUrl) {
    frontmatter.cover = coverUrl;
  }

  return matter.stringify(parsed.content, frontmatter);
}

function parseNormalizedPostData(normalizedMarkdown: string, slug: string): NormalizedPostData {
  const parsed = matter(normalizedMarkdown);
  const frontmatter = parsed.data as Record<string, unknown>;
  const title = toNonEmptyString(frontmatter.title) ?? slug;
  const description = toNonEmptyString(frontmatter.description) ?? "暂无描述";
  const date = toNonEmptyString(frontmatter.date) ?? getTodayDateString();

  if (!isValidDateString(date)) {
    throw new Error("date 格式错误，需为 YYYY-MM-DD");
  }

  const updated = toNonEmptyString(frontmatter.updated);
  if (updated && !isValidDateString(updated)) {
    throw new Error("updated 格式错误，需为 YYYY-MM-DD");
  }

  const tags = normalizeTags(frontmatter.tags) ?? [];
  const draft = frontmatter.draft === true;

  return {
    title,
    description,
    date,
    updated,
    tags,
    draft,
    readingTime: readingTime(parsed.content).text,
    markdownBody: parsed.content,
  };
}

function getApiKeyFromForm(formData: FormData) {
  const value = formData.get("apiKey");
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.status === "disabled") {
      return Response.json({ error: "账号已禁用" }, { status: 403 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

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

    const publishDate = parseFormText(formData, "date");
    if (publishDate && !isValidDateString(publishDate)) {
      return Response.json(
        { error: "date 格式错误，需为 YYYY-MM-DD" },
        { status: 400 },
      );
    }

    const markdownSource = await markdownFile.text();
    const customSlug = formData.get("slug");
    const rawSlug =
      (typeof customSlug === "string" && customSlug.trim()) ||
      markdownFile.name.replace(/\.[^.]+$/, "");
    const slug = sanitizeSlug(rawSlug);

    const supplement: PublishSupplement = {
      title: parseFormText(formData, "title"),
      description: parseFormText(formData, "description"),
      tags: parseFormText(formData, "tags"),
      date: publishDate,
    };

    const existingPost = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        coverUrl: true,
        publishedAt: true,
        tags: true,
      },
    });

    let coverUrl = existingPost?.coverUrl ?? undefined;
    const coverFile = formData.get("coverFile");
    if (coverFile instanceof File && coverFile.size > 0) {
      const coverExt = getExtension(coverFile.name);
      if (!IMAGE_EXTENSIONS.has(coverExt)) {
        return Response.json(
          { error: "Cover image must be png/jpg/jpeg/webp/avif/gif/svg" },
          { status: 400 },
        );
      }

      const coverUpload = await uploadToOss({
        objectKey: `covers/${slug}-${Date.now()}.${coverExt}`,
        content: Buffer.from(await coverFile.arrayBuffer()),
        contentType: getImageContentType(coverExt),
      });
      coverUrl = coverUpload.url;
    }

    const normalizedMarkdown = normalizePostContent(
      markdownSource,
      slug,
      supplement,
      coverUrl,
    );
    const normalized = parseNormalizedPostData(normalizedMarkdown, slug);

    const sourceUpload = await uploadToOss({
      objectKey: `posts/${slug}-${Date.now()}.${markdownExt}`,
      content: Buffer.from(normalizedMarkdown, "utf8"),
      contentType: "text/markdown; charset=utf-8",
    });

    const post = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const upserted = await tx.post.upsert({
        where: { slug },
        create: {
          slug,
          title: normalized.title,
          description: normalized.description,
          date: new Date(normalized.date),
          updated: normalized.updated ? new Date(normalized.updated) : null,
          tags: normalized.tags,
          coverUrl: coverUrl ?? null,
          sourceUrl: sourceUpload.url,
          readingTime: normalized.readingTime,
          draft: normalized.draft,
          authorId: session.user.id,
          publishedAt: normalized.draft ? null : now,
        },
        update: {
          title: normalized.title,
          description: normalized.description,
          date: new Date(normalized.date),
          updated: normalized.updated ? new Date(normalized.updated) : null,
          tags: normalized.tags,
          coverUrl: coverUrl ?? null,
          sourceUrl: sourceUpload.url,
          readingTime: normalized.readingTime,
          draft: normalized.draft,
          authorId: session.user.id,
          publishedAt: normalized.draft
            ? null
            : (existingPost?.publishedAt ?? now),
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          date: true,
          updated: true,
          tags: true,
          coverUrl: true,
          sourceUrl: true,
          readingTime: true,
          draft: true,
          publishedAt: true,
          updatedAt: true,
        },
      });

      await tx.postRevision.create({
        data: {
          postId: upserted.id,
          slug: upserted.slug,
          title: upserted.title,
          description: upserted.description,
          date: upserted.date,
          updated: upserted.updated,
          tags: upserted.tags,
          coverUrl: upserted.coverUrl,
          sourceUrl: upserted.sourceUrl,
          readingTime: upserted.readingTime,
          draft: upserted.draft,
          publishedAt: upserted.publishedAt,
          editorUserId: session.user.id,
        },
      });

      await tx.auditLog.create({
        data: createAuditLogInput({
          actorUserId: session.user.id,
          action: existingPost ? "post.update" : "post.create",
          targetType: "post",
          targetId: upserted.id,
          meta: {
            slug: upserted.slug,
            draft: upserted.draft,
            sourceUrl: upserted.sourceUrl,
            coverUrl: upserted.coverUrl,
            markdownSize: normalized.markdownBody.length,
          },
        }),
      });

      return upserted;
    });

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/posts/${slug}/opengraph-image`);
    revalidatePath("/tags");
    revalidatePath("/rss.xml");
    revalidatePath("/sitemap.xml");

    const relatedTags = new Set<string>([
      ...(existingPost?.tags ?? []),
      ...normalized.tags,
    ]);
    for (const tag of relatedTags) {
      if (!tag.trim()) continue;
      revalidatePath(`/tags/${encodeURIComponent(tag)}`);
    }

    return Response.json({
      success: true,
      mode: existingPost ? "updated" : "created",
      slug,
      postId: post.id,
      sourceUrl: post.sourceUrl,
      coverUrl: post.coverUrl ?? null,
      postUrl: `/posts/${slug}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to publish post";
    return Response.json({ error: message }, { status: 500 });
  }
}
