import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|lighthouse|preview|rendertron|headless|slurp|mediapartners/i;

function normalizeSlug(input: string) {
  return input.trim().replace(/^\/+|\/+$/g, "");
}

function isMissingViewCountColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Post\.viewCount/i.test(message) && /does not exist/i.test(message);
}

export async function POST(request: Request, context: RouteContext) {
  const trackerHeader = request.headers.get("x-view-tracker");
  if (trackerHeader !== "1") {
    return Response.json({ error: "invalid tracker request" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return Response.json({ skipped: true }, { status: 202 });
  }

  const { slug: rawSlug } = await context.params;
  const slug = normalizeSlug(decodeURIComponent(rawSlug || ""));
  if (!slug) {
    return Response.json({ error: "invalid slug" }, { status: 400 });
  }

  try {
    const result = await prisma.post.updateMany({
      where: {
        slug,
        draft: false,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      return Response.json({ error: "post not found" }, { status: 404 });
    }

    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        viewCount: true,
      },
    });

    return Response.json({
      success: true,
      viewCount: post?.viewCount ?? 0,
    });
  } catch (error) {
    if (isMissingViewCountColumnError(error)) {
      return Response.json(
        { error: "viewCount column missing, please run prisma migrate deploy" },
        { status: 503 },
      );
    }
    throw error;
  }
}
