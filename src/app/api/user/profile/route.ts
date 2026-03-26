import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "";
}

function toNullableField(value: unknown) {
  const normalized = toTrimmedString(value);
  if (normalized === undefined) {
    return undefined;
  }
  return normalized === "" ? null : normalized;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateProfileInput(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return { error: "请求体格式错误" } as const;
  }

  const body = payload as Record<string, unknown>;
  const name = toNullableField(body.name);
  const bio = toNullableField(body.bio);
  const website = toNullableField(body.website);
  const image = toNullableField(body.image);

  if (name !== undefined && name !== null && (name.length < 2 || name.length > 30)) {
    return { error: "昵称长度需在 2 到 30 个字符之间" } as const;
  }

  if (bio !== undefined && bio !== null && bio.length > 280) {
    return { error: "个人简介不能超过 280 个字符" } as const;
  }

  if (website !== undefined && website !== null) {
    if (website.length > 200) {
      return { error: "个人网站 URL 不能超过 200 个字符" } as const;
    }
    if (!isValidHttpUrl(website)) {
      return { error: "个人网站 URL 必须以 http:// 或 https:// 开头" } as const;
    }
  }

  if (image !== undefined && image !== null) {
    if (image.length > 500) {
      return { error: "头像 URL 不能超过 500 个字符" } as const;
    }
    if (!isValidHttpUrl(image)) {
      return { error: "头像 URL 必须以 http:// 或 https:// 开头" } as const;
    }
  }

  return {
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(website !== undefined ? { website } : {}),
      ...(image !== undefined ? { image } : {}),
    },
  } as const;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.status === "disabled") {
    return Response.json({ error: "账号已禁用" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      bio: true,
      website: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return Response.json({ error: "用户不存在" }, { status: 404 });
  }

  return Response.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.status === "disabled") {
    return Response.json({ error: "账号已禁用" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = validateProfileInput(payload);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      bio: true,
      website: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ user: updated });
}
