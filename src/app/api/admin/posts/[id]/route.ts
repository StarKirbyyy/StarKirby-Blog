import matter from "gray-matter";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import readingTime from "reading-time";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import { downloadTextFromOss, tryGetOssObjectKeyFromUrl, uploadToOss } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminUserOrError(session: Session | null) {
  if (!session?.user?.id) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.status === "disabled") {
    return { error: Response.json({ error: "账号已禁用" }, { status: 403 }) };
  }
  if (session.user.role !== "admin") {
    return {
      error: Response.json({ error: "Forbidden: admin only" }, { status: 403 }),
    };
  }
  return { user: session.user };
}

async function resolvePostId(context: RouteContext) {
  const params = await context.params;
  return typeof params.id === "string" ? params.id.trim() : "";
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function toDateInputString(value: Date | null) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function toVersionToken(value: Date) {
  return value.toISOString();
}

function toNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    const tags = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(tags));
  }

  if (typeof value === "string") {
    const tags = value
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(tags));
  }

  return [] as string[];
}

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

function getPostExtensionFromSourceUrl(sourceUrl: string) {
  try {
    const pathname = new URL(sourceUrl).pathname.toLowerCase();
    if (pathname.endsWith(".mdx")) return "mdx";
    if (pathname.endsWith(".md")) return "md";
  } catch {
    return "md";
  }
  return "md";
}

async function readPostSourceContentForEdit(sourceUrl: string) {
  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new Error(`Invalid sourceUrl: "${sourceUrl}"`);
  }

  const objectKey = tryGetOssObjectKeyFromUrl(sourceUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let fetchFailureMessage: string | null = null;

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.ok) {
      return await response.text();
    }
    fetchFailureMessage = `Failed to fetch source: ${response.status}`;
  } catch (error) {
    fetchFailureMessage =
      error instanceof Error
        ? `Failed to fetch source request: ${error.message}`
        : `Failed to fetch source request: ${String(error)}`;
  } finally {
    clearTimeout(timer);
  }

  if (objectKey) {
    try {
      return await downloadTextFromOss({ objectKey, revalidate: 1 });
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      throw new Error(`${fetchFailureMessage}; OSS fallback failed: ${fallbackMessage}`);
    }
  }

  throw new Error(fetchFailureMessage ?? `Failed to fetch source: ${sourceUrl}`);
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const postId = await resolvePostId(context);
  if (!postId) {
    return Response.json({ error: "缺少 post id" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
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
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  if (!post) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  const markdown = await readPostSourceContentForEdit(post.sourceUrl);

  return Response.json({
    versionToken: toVersionToken(post.updatedAt),
    post: {
      ...post,
      date: toDateInputString(post.date),
      updated: toDateInputString(post.updated),
      markdown,
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;
  const actorUserId = auth.user.id;

  const postId = await resolvePostId(context);
  if (!postId) {
    return Response.json({ error: "缺少 post id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const title = toNonEmptyString(body.title);
  const description = toNonEmptyString(body.description);
  const date = toNonEmptyString(body.date);
  const updated = toNonEmptyString(body.updated);
  const slugInput = toNonEmptyString(body.slug);
  const expectedUpdatedAt = toNonEmptyString(body.expectedUpdatedAt);
  const intent = toNonEmptyString(body.intent);
  const markdown =
    typeof body.markdown === "string" ? body.markdown.replace(/\r\n/g, "\n") : "";
  const draft = body.draft === true;
  const tags = parseTags(body.tags);
  const validIntent =
    intent === "save_draft" || intent === "publish" || intent === "unpublish";

  if (!title) {
    return Response.json({ error: "title 不能为空" }, { status: 400 });
  }
  if (!description) {
    return Response.json({ error: "description 不能为空" }, { status: 400 });
  }
  if (!date || !isValidDateString(date)) {
    return Response.json(
      { error: "date 格式错误，需为 YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (updated && !isValidDateString(updated)) {
    return Response.json(
      { error: "updated 格式错误，需为 YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (!markdown.trim()) {
    return Response.json({ error: "markdown 不能为空" }, { status: 400 });
  }
  if (!expectedUpdatedAt) {
    return Response.json(
      { error: "缺少 expectedUpdatedAt，无法进行并发冲突检测" },
      { status: 400 },
    );
  }
  if (intent && !validIntent) {
    return Response.json({ error: "intent 参数无效" }, { status: 400 });
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
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
  if (!existingPost) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  const currentVersionToken = toVersionToken(existingPost.updatedAt);
  if (expectedUpdatedAt !== currentVersionToken) {
    return Response.json(
      {
        error: "内容已被其他会话更新，请刷新后重试",
        conflict: true,
        latest: {
          id: existingPost.id,
          slug: existingPost.slug,
          title: existingPost.title,
          description: existingPost.description,
          date: toDateInputString(existingPost.date),
          updated: toDateInputString(existingPost.updated),
          draft: existingPost.draft,
          updatedAt: currentVersionToken,
        },
      },
      { status: 409 },
    );
  }

  const nextSlug = sanitizeSlug(slugInput ?? existingPost.slug);
  if (nextSlug !== existingPost.slug) {
    const conflict = await prisma.post.findUnique({
      where: { slug: nextSlug },
      select: { id: true },
    });
    if (conflict) {
      return Response.json({ error: "slug 已存在，请更换" }, { status: 409 });
    }
  }

  const parsedMarkdown = matter(markdown);
  const readingTimeText = readingTime(parsedMarkdown.content).text;
  const sourceUpload = await uploadToOss({
    objectKey: `posts/${nextSlug}-${Date.now()}.${getPostExtensionFromSourceUrl(existingPost.sourceUrl)}`,
    content: Buffer.from(markdown, "utf8"),
    contentType: "text/markdown; charset=utf-8",
  });

  const now = new Date();
  const updatedPost = await prisma.$transaction(async (tx) => {
    const hasAnyRevision = await tx.postRevision.findFirst({
      where: { postId: existingPost.id },
      select: { id: true },
    });
    if (!hasAnyRevision) {
      await tx.postRevision.create({
        data: {
          postId: existingPost.id,
          slug: existingPost.slug,
          title: existingPost.title,
          description: existingPost.description,
          date: existingPost.date,
          updated: existingPost.updated,
          tags: existingPost.tags,
          coverUrl: existingPost.coverUrl,
          sourceUrl: existingPost.sourceUrl,
          readingTime: existingPost.readingTime,
          draft: existingPost.draft,
          publishedAt: existingPost.publishedAt,
          editorUserId: actorUserId,
        },
      });
    }

    if (nextSlug !== existingPost.slug) {
      await tx.comment.updateMany({
        where: { postSlug: existingPost.slug },
        data: { postSlug: nextSlug },
      });
    }

    const post = await tx.post.update({
      where: { id: existingPost.id },
      data: {
        slug: nextSlug,
        title,
        description,
        date: new Date(date),
        updated: updated ? new Date(updated) : null,
        tags,
        draft,
        sourceUrl: sourceUpload.url,
        readingTime: readingTimeText,
        authorId: actorUserId,
        publishedAt: draft ? null : (existingPost.publishedAt ?? now),
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
        postId: post.id,
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        updated: post.updated,
        tags: post.tags,
        coverUrl: post.coverUrl,
        sourceUrl: post.sourceUrl,
        readingTime: post.readingTime,
        draft: post.draft,
        publishedAt: post.publishedAt,
        editorUserId: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId,
        action: draft
          ? existingPost.draft
            ? "post.edit.save_draft"
            : "post.edit.unpublish"
          : existingPost.draft
            ? "post.edit.publish"
            : "post.edit.publish_update",
        targetType: "post",
        targetId: post.id,
        meta: {
          intent: validIntent ? intent : null,
          previousSlug: existingPost.slug,
          slug: post.slug,
          previousDraft: existingPost.draft,
          draft: post.draft,
          sourceUrl: post.sourceUrl,
          title: post.title,
          markdownSize: parsedMarkdown.content.length,
        },
      }),
    });

    return post;
  });

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${existingPost.slug}`);
  revalidatePath(`/posts/${updatedPost.slug}`);
  revalidatePath(`/posts/${existingPost.slug}/opengraph-image`);
  revalidatePath(`/posts/${updatedPost.slug}/opengraph-image`);
  revalidatePath("/tags");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  const relatedTags = new Set<string>([
    ...existingPost.tags,
    ...updatedPost.tags,
  ]);
  for (const tag of relatedTags) {
    if (!tag.trim()) continue;
    revalidatePath(`/tags/${encodeURIComponent(tag)}`);
  }

  return Response.json({
    success: true,
    post: {
      ...updatedPost,
      date: toDateInputString(updatedPost.date),
      updated: toDateInputString(updatedPost.updated),
    },
    versionToken: toVersionToken(updatedPost.updatedAt),
    postUrl: `/posts/${updatedPost.slug}`,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;
  const actorUserId = auth.user.id;

  const postId = await resolvePostId(context);
  if (!postId) {
    return Response.json({ error: "缺少 post id" }, { status: 400 });
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      title: true,
      coverUrl: true,
      sourceUrl: true,
      tags: true,
      draft: true,
    },
  });
  if (!existingPost) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedComments = await tx.comment.deleteMany({
      where: { postSlug: existingPost.slug },
    });

    await tx.post.delete({
      where: { id: existingPost.id },
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId,
        action: "post.delete",
        targetType: "post",
        targetId: existingPost.id,
        meta: {
          slug: existingPost.slug,
          title: existingPost.title,
          draft: existingPost.draft,
          coverUrl: existingPost.coverUrl,
          sourceUrl: existingPost.sourceUrl,
          deletedComments: deletedComments.count,
        },
      }),
    });

    return {
      deletedComments: deletedComments.count,
    };
  });

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${existingPost.slug}`);
  revalidatePath(`/posts/${existingPost.slug}/opengraph-image`);
  revalidatePath("/tags");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  for (const tag of existingPost.tags) {
    if (!tag.trim()) continue;
    revalidatePath(`/tags/${encodeURIComponent(tag)}`);
  }

  return Response.json({
    success: true,
    deletedComments: result.deletedComments,
  });
}
