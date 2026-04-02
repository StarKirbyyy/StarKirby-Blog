import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || null;
}

function getIpHash(ip: string | null) {
  if (!ip) return null;
  const salt = process.env.NEWSLETTER_IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = normalizeEmail(rawEmail);
  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  const source = typeof body.source === "string" ? body.source.trim() : null;
  const userAgent = request.headers.get("user-agent");
  const ipHash = getIpHash(getClientIp(request));
  const now = new Date();

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      status: "active",
      source: source || "site",
      userAgent,
      ipHash,
      subscribedAt: now,
      unsubscribedAt: null,
    },
    update: {
      status: "active",
      source: source || "site",
      userAgent,
      ipHash,
      subscribedAt: now,
      unsubscribedAt: null,
    },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  return Response.json({
    success: true,
    message: "订阅成功，后续会通过邮件通知更新。",
    subscriber,
  });
}
