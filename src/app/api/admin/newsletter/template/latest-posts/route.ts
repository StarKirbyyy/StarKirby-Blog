import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { siteConfig } from "@/config/site";
import { toAbsoluteUrl } from "@/lib/url";
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

function safeInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseTags(value: string | null) {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(/[,，\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const limit = safeInt(searchParams.get("limit"), 5, 1, 20);
  const tags = parseTags(searchParams.get("tags"));

  const posts = await prisma.post.findMany({
    where: {
      draft: false,
      ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      slug: true,
      title: true,
      description: true,
      date: true,
      tags: true,
    },
  });

  if (posts.length === 0) {
    return Response.json({ error: "没有可用于模板的文章" }, { status: 404 });
  }

  const today = formatDate(new Date());
  const subject =
    tags.length > 0
      ? `${siteConfig.name} ${today} 更新（${tags.join(" / ")}）`
      : `${siteConfig.name} ${today} 更新`;

  const bodyLines = [
    `你好，`,
    "",
    `这是 ${siteConfig.name} 的最新文章更新。`,
    tags.length > 0 ? `本期分组标签：${tags.join("、")}` : "",
    "",
  ].filter(Boolean);

  posts.forEach((post, index) => {
    const link = toAbsoluteUrl(`/posts/${encodeURIComponent(post.slug)}`);
    bodyLines.push(`${index + 1}. ${post.title}`);
    bodyLines.push(`发布日期：${formatDate(post.date)}`);
    if (post.tags.length > 0) {
      bodyLines.push(`标签：${post.tags.join("、")}`);
    }
    bodyLines.push(`摘要：${post.description}`);
    bodyLines.push(`阅读链接：${link}`);
    bodyLines.push("");
  });

  bodyLines.push("感谢你的订阅，我们下期见。");
  bodyLines.push(`${siteConfig.name}`);

  return Response.json({
    success: true,
    subject,
    bodyText: bodyLines.join("\n"),
    meta: {
      limit,
      tags,
      count: posts.length,
    },
  });
}
