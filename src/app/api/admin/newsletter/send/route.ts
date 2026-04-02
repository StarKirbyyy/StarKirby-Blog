import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import {
  dispatchNewsletterCampaignById,
  parseTagInput,
} from "@/lib/newsletter-campaign";
import {
  getNewsletterSendingConfig,
  sendNewsletterEmail,
  toSimpleHtmlBody,
} from "@/lib/newsletter-send";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SUBJECT_LENGTH = 180;
const MAX_BODY_LENGTH = 60_000;

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

function toNonEmptyString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseScheduledAt(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const subject = toNonEmptyString(body.subject);
  const text = toNonEmptyString(body.bodyText);
  const testEmailRaw = toNonEmptyString(body.testEmail);
  const segmentTags = parseTagInput(toNonEmptyString(body.segmentTags));
  const scheduledAtRaw = toNonEmptyString(body.scheduledAt);
  const scheduledAt = parseScheduledAt(scheduledAtRaw);
  const dryRun = body.dryRun === true;

  if (!subject) {
    return Response.json({ error: "subject 不能为空" }, { status: 400 });
  }
  if (!text) {
    return Response.json({ error: "bodyText 不能为空" }, { status: 400 });
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return Response.json(
      { error: `subject 过长，最大 ${MAX_SUBJECT_LENGTH} 字符` },
      { status: 400 },
    );
  }
  if (text.length > MAX_BODY_LENGTH) {
    return Response.json(
      { error: `bodyText 过长，最大 ${MAX_BODY_LENGTH} 字符` },
      { status: 400 },
    );
  }
  if (testEmailRaw) {
    const testEmail = normalizeEmail(testEmailRaw);
    if (!isValidEmail(testEmail)) {
      return Response.json({ error: "testEmail 邮箱格式错误" }, { status: 400 });
    }
  }
  if (scheduledAtRaw && !scheduledAt) {
    return Response.json({ error: "scheduledAt 格式错误" }, { status: 400 });
  }
  if (testEmailRaw && scheduledAt && scheduledAt.getTime() > Date.now()) {
    return Response.json(
      { error: "测试邮箱发送不支持定时，请去掉 scheduledAt 或去掉 testEmail" },
      { status: 400 },
    );
  }

  const config = getNewsletterSendingConfig();
  if (!config.ready && !dryRun) {
    return Response.json(
      {
        error: `Newsletter 发送配置不完整，缺少：${config.missing.join(", ")}`,
      },
      { status: 500 },
    );
  }

  const html = toSimpleHtmlBody(text);
  const senderEmail = config.from || "unset@example.com";
  const replyToEmail = config.replyTo || null;

  const activeTotal = testEmailRaw
    ? 1
    : await prisma.newsletterSubscriber.count({
        where: { status: "active" },
      });

  if (activeTotal <= 0) {
    return Response.json({ error: "没有可发送的订阅用户" }, { status: 400 });
  }

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      subject,
      bodyText: text,
      bodyHtml: html,
      provider: config.provider,
      status: "queued",
      totalRecipients: activeTotal,
      senderEmail,
      replyToEmail,
      segmentTags,
      scheduledAt,
      createdByUserId: auth.user.id,
    },
    select: { id: true },
  });

  if (dryRun) {
    await prisma.$transaction(async (tx) => {
      await tx.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "sent",
          sentCount: activeTotal,
          failedCount: 0,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: createAuditLogInput({
          actorUserId: auth.user.id,
          action: "newsletter.send.dry_run",
          targetType: "system",
          targetId: campaign.id,
          meta: {
            subject,
            recipients: activeTotal,
            provider: config.provider,
            segmentTags,
            scheduledAt: scheduledAt?.toISOString() ?? null,
          },
        }),
      });
    });

    return Response.json({
      success: true,
      dryRun: true,
      campaignId: campaign.id,
      sentCount: activeTotal,
      failedCount: 0,
      totalRecipients: activeTotal,
    });
  }

  if (scheduledAt && scheduledAt.getTime() > Date.now()) {
    await prisma.auditLog.create({
      data: createAuditLogInput({
        actorUserId: auth.user.id,
        action: "newsletter.schedule",
        targetType: "system",
        targetId: campaign.id,
        meta: {
          subject,
          scheduledAt: scheduledAt.toISOString(),
          segmentTags,
          totalRecipients: activeTotal,
        },
      }),
    });
    return Response.json({
      success: true,
      scheduled: true,
      campaignId: campaign.id,
      scheduledAt: scheduledAt.toISOString(),
      totalRecipients: activeTotal,
    });
  }

  if (testEmailRaw) {
    const testEmail = normalizeEmail(testEmailRaw);
    const result = await sendNewsletterEmail({
      to: testEmail,
      subject,
      text,
      html,
      from: senderEmail,
      replyTo: replyToEmail ?? undefined,
    });

    const sent = result.ok ? 1 : 0;
    const failed = result.ok ? 0 : 1;
    const status = result.ok ? "sent" : "failed";
    const errorSummary = result.ok ? null : result.error;

    await prisma.$transaction(async (tx) => {
      await tx.newsletterDelivery.create({
        data: {
          campaignId: campaign.id,
          subscriberId: null,
          email: testEmail,
          status: result.ok ? "sent" : "failed",
          providerMessageId: result.ok ? result.messageId : undefined,
          errorMessage: result.ok ? undefined : result.error,
        },
      });

      await tx.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          status,
          sentCount: sent,
          failedCount: failed,
          errorSummary,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: createAuditLogInput({
          actorUserId: auth.user.id,
          action: "newsletter.send.test",
          targetType: "system",
          targetId: campaign.id,
          meta: {
            subject,
            testEmail,
            provider: config.provider,
            result: status,
            errorSummary,
            segmentTags,
          },
        }),
      });
    });

    return Response.json({
      success: true,
      campaignId: campaign.id,
      status,
      totalRecipients: 1,
      sentCount: sent,
      failedCount: failed,
      errorSummary,
    });
  }

  const dispatchResult = await dispatchNewsletterCampaignById(campaign.id, {
    actorUserId: auth.user.id,
  });

  return Response.json({
    success: true,
    ...dispatchResult,
  });
}
