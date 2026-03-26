import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
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

function safePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeStatus(value: string | null) {
  if (value === "published" || value === "draft") {
    return value;
  }
  return "all";
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = safePositiveInt(searchParams.get("page"), 1);
  const pageSizeRaw = safePositiveInt(searchParams.get("pageSize"), 20);
  const pageSize = Math.min(pageSizeRaw, 100);
  const status = normalizeStatus(searchParams.get("status"));
  const q = (searchParams.get("q") ?? "").trim();

  const where: Prisma.PostWhereInput = {};
  if (status === "published") {
    where.draft = false;
  } else if (status === "draft") {
    where.draft = true;
  }
  if (q) {
    where.OR = [
      { slug: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, posts] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
  ]);

  return Response.json({
    posts,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    filters: {
      status,
      q: q || null,
    },
  });
}
