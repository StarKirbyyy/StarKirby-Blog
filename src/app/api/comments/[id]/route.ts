import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import {
  COMMENT_MAX_LENGTH,
  commentPublicSelect,
  normalizeContent,
} from "@/lib/comments";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

async function resolveCommentId(context: RouteContext) {
  const params = await Promise.resolve(context.params);
  return typeof params.id === "string" ? params.id.trim() : "";
}

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.status === "disabled") {
    return Response.json({ error: "账号已禁用" }, { status: 403 });
  }

  const commentId = await resolveCommentId(context);
  if (!commentId) {
    return Response.json({ error: "缺少 comment id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const content = normalizeContent(body.content);
  if (!content) {
    return Response.json({ error: "评论内容不能为空" }, { status: 400 });
  }
  if (content.length > COMMENT_MAX_LENGTH) {
    return Response.json(
      { error: `评论内容不能超过 ${COMMENT_MAX_LENGTH} 字` },
      { status: 400 },
    );
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postSlug: true,
    },
  });
  if (!existingComment) {
    return Response.json({ error: "评论不存在" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = existingComment.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.$transaction(async (tx) => {
    const updated = await tx.comment.update({
      where: { id: existingComment.id },
      data: { content },
      select: commentPublicSelect,
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId: session.user.id,
        action: "comment.edit",
        targetType: "comment",
        targetId: existingComment.id,
        meta: {
          postSlug: existingComment.postSlug,
          byAdmin: isAdmin && !isOwner,
        },
      }),
    });

    return updated;
  });

  return Response.json({ comment });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.status === "disabled") {
    return Response.json({ error: "账号已禁用" }, { status: 403 });
  }

  const commentId = await resolveCommentId(context);
  if (!commentId) {
    return Response.json({ error: "缺少 comment id" }, { status: 400 });
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      userId: true,
      postSlug: true,
      status: true,
    },
  });
  if (!existingComment) {
    return Response.json({ error: "评论不存在" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = existingComment.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.delete({
      where: { id: existingComment.id },
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId: session.user.id,
        action: "comment.delete",
        targetType: "comment",
        targetId: existingComment.id,
        meta: {
          postSlug: existingComment.postSlug,
          byAdmin: isAdmin && !isOwner,
          previousStatus: existingComment.status,
        },
      }),
    });
  });

  return Response.json({ success: true });
}
