import { createAuditLogInput } from "@/lib/audit";
import {
  getNewsletterSendingConfig,
  sendNewsletterEmail,
  toSimpleHtmlBody,
} from "@/lib/newsletter-send";
import { prisma } from "@/lib/prisma";

type DispatchOptions = {
  actorUserId?: string | null;
};

function chunk<T>(array: T[], size: number) {
  const groups: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    groups.push(array.slice(i, i + size));
  }
  return groups;
}

function normalizeTagList(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function parseTagInput(value: string | undefined) {
  if (!value) return [];
  return normalizeTagList(value.split(/[,，\n]/));
}

export async function dispatchNewsletterCampaignById(
  campaignId: string,
  options: DispatchOptions = {},
) {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      subject: true,
      bodyText: true,
      bodyHtml: true,
      provider: true,
      status: true,
      senderEmail: true,
      replyToEmail: true,
      segmentTags: true,
      deliveries: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!campaign) {
    throw new Error("campaign 不存在");
  }

  if (campaign.status !== "queued") {
    return {
      campaignId: campaign.id,
      skipped: true,
      reason: `campaign status is ${campaign.status}`,
    };
  }

  if (campaign.deliveries.length > 0) {
    return {
      campaignId: campaign.id,
      skipped: true,
      reason: "campaign already has deliveries",
    };
  }

  const config = getNewsletterSendingConfig();
  if (!config.ready) {
    throw new Error(`Newsletter 发送配置不完整，缺少：${config.missing.join(", ")}`);
  }

  const activeSubscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: "active" },
    select: {
      id: true,
      email: true,
    },
    orderBy: [{ subscribedAt: "asc" }],
  });

  if (activeSubscribers.length === 0) {
    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "failed",
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        errorSummary: "没有活跃订阅用户",
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });
    return {
      campaignId: campaign.id,
      status: "failed",
      totalRecipients: 0,
      sentCount: 0,
      failedCount: 0,
      errorSummary: "没有活跃订阅用户",
    };
  }

  const subject = campaign.subject;
  const text = campaign.bodyText;
  const html = campaign.bodyHtml || toSimpleHtmlBody(text);
  const senderEmail = campaign.senderEmail || config.from;
  const replyToEmail = campaign.replyToEmail || config.replyTo || undefined;

  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: {
      startedAt: new Date(),
      totalRecipients: activeSubscribers.length,
      status: "queued",
    },
  });

  const deliveries: Array<{
    subscriberId: string | null;
    email: string;
    status: "sent" | "failed";
    providerMessageId?: string;
    errorMessage?: string;
  }> = [];

  for (const group of chunk(activeSubscribers, 5)) {
    const settled = await Promise.allSettled(
      group.map(async (target) => {
        const result = await sendNewsletterEmail({
          to: target.email,
          subject,
          text,
          html,
          from: senderEmail,
          replyTo: replyToEmail,
        });
        if (result.ok) {
          return {
            subscriberId: target.id,
            email: target.email,
            status: "sent" as const,
            providerMessageId: result.messageId,
          };
        }
        return {
          subscriberId: target.id,
          email: target.email,
          status: "failed" as const,
          errorMessage: result.error,
        };
      }),
    );

    for (const item of settled) {
      if (item.status === "fulfilled") {
        deliveries.push(item.value);
      } else {
        deliveries.push({
          subscriberId: null,
          email: "unknown@unknown",
          status: "failed",
          errorMessage: item.reason instanceof Error ? item.reason.message : "unknown error",
        });
      }
    }
  }

  const sentCount = deliveries.filter((item) => item.status === "sent").length;
  const failedCount = deliveries.length - sentCount;
  const status =
    failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial";
  const errorSummary =
    failedCount > 0
      ? deliveries
          .filter((item) => item.status === "failed")
          .slice(0, 5)
          .map((item) => `${item.email}: ${item.errorMessage ?? "unknown"}`)
          .join(" | ")
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.newsletterDelivery.createMany({
      data: deliveries.map((item) => ({
        campaignId: campaign.id,
        subscriberId: item.subscriberId,
        email: item.email,
        status: item.status,
        providerMessageId: item.providerMessageId,
        errorMessage: item.errorMessage,
      })),
      skipDuplicates: true,
    });

    await tx.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status,
        sentCount,
        failedCount,
        totalRecipients: activeSubscribers.length,
        errorSummary,
        completedAt: new Date(),
      },
    });

    if (options.actorUserId) {
      await tx.auditLog.create({
        data: createAuditLogInput({
          actorUserId: options.actorUserId,
          action: "newsletter.dispatch",
          targetType: "system",
          targetId: campaign.id,
          meta: {
            subject,
            status,
            totalRecipients: activeSubscribers.length,
            sentCount,
            failedCount,
            segmentTags: campaign.segmentTags,
          },
        }),
      });
    }
  });

  return {
    campaignId: campaign.id,
    status,
    totalRecipients: activeSubscribers.length,
    sentCount,
    failedCount,
    errorSummary,
  };
}
