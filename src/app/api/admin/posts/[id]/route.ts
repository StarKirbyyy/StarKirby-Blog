import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
