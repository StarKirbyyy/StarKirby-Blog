import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import {
  commentAdminSelect,
  normalizeCommentStatus,
} from "@/lib/comments";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function resolveCommentId(context: RouteContext) {
  const params = await context.params;
  return typeof params.id === "string" ? params.id.trim() : "";
}

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;
  const actorUserId = auth.user.id;

  const commentId = await resolveCommentId(context);
  if (!commentId) {
    return Response.json({ error: "缺少 comment id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const status = normalizeCommentStatus(body.status);
  if (!status) {
    return Response.json({ error: "status 仅支持 visible 或 hidden" }, { status: 400 });
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      status: true,
      postSlug: true,
    },
  });
  if (!existingComment) {
    return Response.json({ error: "评论不存在" }, { status: 404 });
  }

  const comment = await prisma.$transaction(async (tx) => {
    const updated = await tx.comment.update({
      where: { id: commentId },
      data: { status },
      select: commentAdminSelect,
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId,
        action: "comment.moderate",
        targetType: "comment",
        targetId: commentId,
        meta: {
          postSlug: existingComment.postSlug,
          previousStatus: existingComment.status,
          nextStatus: status,
        },
      }),
    });

    return updated;
  });

  return Response.json({ comment });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;
  const actorUserId = auth.user.id;

  const commentId = await resolveCommentId(context);
  if (!commentId) {
    return Response.json({ error: "缺少 comment id" }, { status: 400 });
  }

  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      postSlug: true,
      userId: true,
      status: true,
    },
  });
  if (!existingComment) {
    return Response.json({ error: "评论不存在" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.delete({
      where: { id: commentId },
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId,
        action: "comment.admin_delete",
        targetType: "comment",
        targetId: commentId,
        meta: {
          postSlug: existingComment.postSlug,
          ownerUserId: existingComment.userId,
          previousStatus: existingComment.status,
        },
      }),
    });
  });

  return Response.json({ success: true });
}
