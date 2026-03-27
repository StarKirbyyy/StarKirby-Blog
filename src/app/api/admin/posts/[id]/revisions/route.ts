import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
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

function safePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const postId = await resolvePostId(context);
  if (!postId) {
    return Response.json({ error: "缺少 post id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const page = safePositiveInt(searchParams.get("page"), 1);
  const pageSizeRaw = safePositiveInt(searchParams.get("pageSize"), 20);
  const pageSize = Math.min(pageSizeRaw, 100);

  const [total, revisions] = await prisma.$transaction([
    prisma.postRevision.count({
      where: { postId },
    }),
    prisma.postRevision.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        draft: true,
        readingTime: true,
        createdAt: true,
        editorUser: {
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
    revisions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
