import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import { uploadToOss } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "avif", "gif", "svg"]);
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

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

function getExtension(filename: string) {
  const matched = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return matched?.[1] || "";
}

function getImageContentType(ext: string) {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function sanitizeAltText(filename: string) {
  const withoutExt = filename.replace(/\.[^.]+$/, "");
  const normalized = withoutExt
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\u4e00-\u9fa5\s]/g, "")
    .trim();
  return normalized || "image";
}

function sanitizeObjectKeyPart(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolvePostId(context: RouteContext) {
  const params = await context.params;
  return typeof params.id === "string" ? params.id.trim() : "";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const auth = getAdminUserOrError(session);
    if (auth.error) return auth.error;
    const actorUserId = auth.user.id;

    const postId = await resolvePostId(context);
    if (!postId) {
      return Response.json({ error: "缺少 post id" }, { status: 400 });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        slug: true,
      },
    });
    if (!existingPost) {
      return Response.json({ error: "文章不存在" }, { status: 404 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("file");
    if (!(imageFile instanceof File) || imageFile.size <= 0) {
      return Response.json({ error: "缺少图片文件" }, { status: 400 });
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return Response.json(
        { error: `图片大小不能超过 ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)}MB` },
        { status: 400 },
      );
    }

    const ext = getExtension(imageFile.name);
    if (!IMAGE_EXTENSIONS.has(ext)) {
      return Response.json(
        { error: "仅支持 png/jpg/jpeg/webp/avif/gif/svg" },
        { status: 400 },
      );
    }

    const slugPart = sanitizeObjectKeyPart(existingPost.slug) || existingPost.id;
    const objectKey = `posts/${slugPart}/assets/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const uploadResult = await uploadToOss({
      objectKey,
      content: Buffer.from(await imageFile.arrayBuffer()),
      contentType: getImageContentType(ext),
    });

    const alt = sanitizeAltText(imageFile.name);
    const markdown = `![${alt}](${uploadResult.url})`;

    await prisma.auditLog.create({
      data: createAuditLogInput({
        actorUserId,
        action: "post.edit.upload_asset",
        targetType: "post",
        targetId: existingPost.id,
        meta: {
          slug: existingPost.slug,
          objectKey,
          assetUrl: uploadResult.url,
          size: imageFile.size,
          fileName: imageFile.name,
        },
      }),
    });

    return Response.json({
      success: true,
      url: uploadResult.url,
      alt,
      markdown,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "上传图片失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
