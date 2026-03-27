import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import { downloadTextFromOss, tryGetOssObjectKeyFromUrl } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string; revisionId: string }>;
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

async function resolveParams(context: RouteContext) {
  const params = await context.params;
  return {
    postId: typeof params.id === "string" ? params.id.trim() : "",
    revisionId: typeof params.revisionId === "string" ? params.revisionId.trim() : "",
  };
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

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;
  const actorUserId = auth.user.id;

  const { postId, revisionId } = await resolveParams(context);
  if (!postId || !revisionId) {
    return Response.json({ error: "缺少 post id 或 revision id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const expectedUpdatedAt = toNonEmptyString(body.expectedUpdatedAt);
  if (!expectedUpdatedAt) {
    return Response.json(
      { error: "缺少 expectedUpdatedAt，无法进行并发冲突检测" },
      { status: 400 },
    );
  }

  const currentPost = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      tags: true,
      updatedAt: true,
    },
  });
  if (!currentPost) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  const currentVersionToken = toVersionToken(currentPost.updatedAt);
  if (currentVersionToken !== expectedUpdatedAt) {
    return Response.json(
      {
        error: "内容已被其他会话更新，请刷新后重试",
        conflict: true,
        latest: {
          id: currentPost.id,
          slug: currentPost.slug,
          updatedAt: currentVersionToken,
        },
      },
      { status: 409 },
    );
  }

  const revision = await prisma.postRevision.findFirst({
    where: {
      id: revisionId,
      postId,
    },
    select: {
      id: true,
      postId: true,
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
    },
  });
  if (!revision) {
    return Response.json({ error: "版本记录不存在" }, { status: 404 });
  }

  if (revision.slug !== currentPost.slug) {
    const slugConflict = await prisma.post.findUnique({
      where: { slug: revision.slug },
      select: { id: true },
    });
    if (slugConflict && slugConflict.id !== currentPost.id) {
      return Response.json(
        { error: "回滚失败：目标 slug 已被其他文章占用" },
        { status: 409 },
      );
    }
  }

  const restored = await prisma.$transaction(async (tx) => {
    if (revision.slug !== currentPost.slug) {
      await tx.comment.updateMany({
        where: { postSlug: currentPost.slug },
        data: { postSlug: revision.slug },
      });
    }

    const post = await tx.post.update({
      where: { id: currentPost.id },
      data: {
        slug: revision.slug,
        title: revision.title,
        description: revision.description,
        date: revision.date,
        updated: revision.updated,
        tags: revision.tags,
        coverUrl: revision.coverUrl,
        sourceUrl: revision.sourceUrl,
        readingTime: revision.readingTime,
        draft: revision.draft,
        publishedAt: revision.publishedAt,
        authorId: actorUserId,
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
        action: "post.edit.rollback",
        targetType: "post",
        targetId: post.id,
        meta: {
          revisionId: revision.id,
          revisionCreatedAt: revision.createdAt.toISOString(),
          previousSlug: currentPost.slug,
          restoredSlug: post.slug,
          draft: post.draft,
        },
      }),
    });

    return post;
  });

  const markdown = await readPostSourceContentForEdit(restored.sourceUrl);

  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${currentPost.slug}`);
  revalidatePath(`/posts/${restored.slug}`);
  revalidatePath(`/posts/${currentPost.slug}/opengraph-image`);
  revalidatePath(`/posts/${restored.slug}/opengraph-image`);
  revalidatePath("/tags");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  const relatedTags = new Set<string>([
    ...currentPost.tags,
    ...restored.tags,
  ]);
  for (const tag of relatedTags) {
    if (!tag.trim()) continue;
    revalidatePath(`/tags/${encodeURIComponent(tag)}`);
  }

  return Response.json({
    success: true,
    post: {
      ...restored,
      date: toDateInputString(restored.date),
      updated: toDateInputString(restored.updated),
      markdown,
    },
    versionToken: toVersionToken(restored.updatedAt),
    postUrl: `/posts/${restored.slug}`,
  });
}
