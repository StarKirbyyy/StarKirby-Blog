import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPostBySlug } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_RATE_LIMIT_MAX_COUNT,
  COMMENT_RATE_LIMIT_WINDOW_MS,
  commentPublicSelect,
  normalizeContent,
  normalizePostSlug,
} from "@/lib/comments";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postSlug = normalizePostSlug(searchParams.get("postSlug"));
  if (!postSlug) {
    return Response.json({ error: "缺少 postSlug" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: {
      postSlug,
      status: "visible",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: commentPublicSelect,
  });

  return Response.json({ comments });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.status === "disabled") {
    return Response.json({ error: "账号已禁用" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const postSlug = normalizePostSlug(body.postSlug);
  const content = normalizeContent(body.content);

  if (!postSlug) {
    return Response.json({ error: "缺少 postSlug" }, { status: 400 });
  }
  if (!content) {
    return Response.json({ error: "评论内容不能为空" }, { status: 400 });
  }
  if (content.length > COMMENT_MAX_LENGTH) {
    return Response.json(
      { error: `评论内容不能超过 ${COMMENT_MAX_LENGTH} 字` },
      { status: 400 },
    );
  }

  const post = await getPostBySlug(postSlug);
  if (!post) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  const perMinuteLimit =
    Number.isFinite(COMMENT_RATE_LIMIT_MAX_COUNT) && COMMENT_RATE_LIMIT_MAX_COUNT > 0
      ? COMMENT_RATE_LIMIT_MAX_COUNT
      : 5;
  const recentWindowStart = new Date(Date.now() - COMMENT_RATE_LIMIT_WINDOW_MS);
  const recentCommentCount = await prisma.comment.count({
    where: {
      userId: session.user.id,
      createdAt: {
        gte: recentWindowStart,
      },
    },
  });
  if (recentCommentCount >= perMinuteLimit) {
    return Response.json(
      { error: `评论过于频繁，请稍后再试（每分钟最多 ${perMinuteLimit} 条）` },
      { status: 429 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      postSlug,
      content,
      userId: session.user.id,
      status: "visible",
    },
    select: commentPublicSelect,
  });

  return Response.json({ comment }, { status: 201 });
}
