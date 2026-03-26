import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  commentAdminSelect,
  normalizeCommentStatus,
  normalizePostSlug,
  safePositiveInt,
} from "@/lib/comments";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = safePositiveInt(searchParams.get("page"), 1);
  const pageSizeRaw = safePositiveInt(searchParams.get("pageSize"), 20);
  const pageSize = Math.min(pageSizeRaw, 100);
  const postSlug = normalizePostSlug(searchParams.get("postSlug"));
  const status = normalizeCommentStatus(searchParams.get("status"));

  const where: Prisma.CommentWhereInput = {};
  if (postSlug) {
    where.postSlug = postSlug;
  }
  if (status) {
    where.status = status;
  }

  const [total, comments] = await prisma.$transaction([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: commentAdminSelect,
    }),
  ]);

  return Response.json({
    comments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    filters: {
      postSlug: postSlug || null,
      status: status || "all",
    },
  });
}
