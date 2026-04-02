import type { NewsletterStatus } from "@prisma/client";
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

async function resolveSubscriberId(context: RouteContext) {
  const params = await context.params;
  return typeof params.id === "string" ? params.id.trim() : "";
}

function normalizeStatus(value: unknown): NewsletterStatus | null {
  if (value === "active" || value === "unsubscribed") {
    return value;
  }
  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;
  const actorUserId = auth.user.id;

  const subscriberId = await resolveSubscriberId(context);
  if (!subscriberId) {
    return Response.json({ error: "缺少 subscriber id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  const nextStatus = normalizeStatus(body.status);
  if (!nextStatus) {
    return Response.json({ error: "status 仅支持 active 或 unsubscribed" }, { status: 400 });
  }

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });
  if (!existing) {
    return Response.json({ error: "订阅记录不存在" }, { status: 404 });
  }

  const subscriber = await prisma.$transaction(async (tx) => {
    const updated = await tx.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: {
        status: nextStatus,
        unsubscribedAt: nextStatus === "unsubscribed" ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        status: true,
        source: true,
        subscribedAt: true,
        unsubscribedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: createAuditLogInput({
        actorUserId,
        action: "newsletter.status_update",
        targetType: "system",
        targetId: existing.id,
        meta: {
          email: existing.email,
          previousStatus: existing.status,
          nextStatus,
        },
      }),
    });

    return updated;
  });

  return Response.json({ subscriber });
}
