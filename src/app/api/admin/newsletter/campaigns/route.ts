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
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = safePositiveInt(searchParams.get("page"), 1);
  const pageSizeRaw = safePositiveInt(searchParams.get("pageSize"), 10);
  const pageSize = Math.min(pageSizeRaw, 50);
  const status = (searchParams.get("status") ?? "").trim();

  const where: Prisma.NewsletterCampaignWhereInput = {};
  if (status === "queued" || status === "partial" || status === "sent" || status === "failed") {
    where.status = status;
  }

  const [total, campaigns] = await prisma.$transaction([
    prisma.newsletterCampaign.count({ where }),
    prisma.newsletterCampaign.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        subject: true,
        provider: true,
        segmentTags: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        senderEmail: true,
        replyToEmail: true,
        errorSummary: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
        createdByUser: {
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
    campaigns,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    filter: {
      status: status || "all",
    },
  });
}
