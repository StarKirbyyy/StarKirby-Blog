import { dispatchNewsletterCampaignById } from "@/lib/newsletter-campaign";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const querySecret = (url.searchParams.get("secret") ?? "").trim();
  if (querySecret && querySecret === secret) return true;

  return false;
}

async function runDispatch(limit: number) {
  const now = new Date();
  const campaigns = await prisma.newsletterCampaign.findMany({
    where: {
      status: "queued",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    select: {
      id: true,
    },
  });

  const results = [];
  for (const campaign of campaigns) {
    try {
      const result = await dispatchNewsletterCampaignById(campaign.id);
      results.push({ campaignId: campaign.id, ok: true, result });
    } catch (error) {
      results.push({
        campaignId: campaign.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    now: now.toISOString(),
    processed: campaigns.length,
    results,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized cron request" }, { status: 401 });
  }
  const payload = await runDispatch(3);
  return Response.json({ success: true, ...payload });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized cron request" }, { status: 401 });
  }
  const payload = await runDispatch(3);
  return Response.json({ success: true, ...payload });
}
