import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLogInput } from "@/lib/audit";
import { createSignedOssPutUpload, uploadToOss } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

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

type PresignRequestBody = {
  filename?: string;
  contentType?: string;
  size?: number;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const auth = getAdminUserOrError(session);
    if (auth.error) return auth.error;

    const requestContentType = request.headers.get("content-type") || "";
    if (requestContentType.includes("application/json")) {
      const json = (await request.json().catch(() => null)) as PresignRequestBody | null;
      const filename = typeof json?.filename === "string" ? json.filename : "";
      const ext = getExtension(filename);
      if (!IMAGE_EXTENSIONS.has(ext)) {
        return Response.json(
          { error: "仅支持 png/jpg/jpeg/webp/avif/gif/svg" },
          { status: 400 },
        );
      }

      const size = typeof json?.size === "number" ? json.size : Number.NaN;
      if (!Number.isFinite(size) || size <= 0) {
        return Response.json({ error: "缺少图片大小信息" }, { status: 400 });
      }
      if (size > MAX_IMAGE_SIZE) {
        return Response.json(
          { error: `图片大小不能超过 ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)}MB` },
          { status: 413 },
        );
      }

      const contentType = getImageContentType(ext);
      const objectKey = `theme/assets/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
      const signed = createSignedOssPutUpload({
        objectKey,
        contentType,
      });

      await prisma.auditLog.create({
        data: createAuditLogInput({
          actorUserId: auth.user.id,
          action: "sakurairo.settings.presign_asset",
          targetType: "system",
          targetId: "sakurairo_theme",
          meta: {
            objectKey,
            assetUrl: signed.url,
            size,
            fileName: filename,
            mode: "direct",
          },
        }),
      });

      return Response.json({
        success: true,
        mode: "direct",
        objectKey,
        url: signed.url,
        uploadUrl: signed.uploadUrl,
        uploadHeaders: signed.uploadHeaders,
      });
    }

    const formData = await request.formData();
    const imageFile = formData.get("file");
    if (!(imageFile instanceof File) || imageFile.size <= 0) {
      return Response.json({ error: "缺少图片文件" }, { status: 400 });
    }
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return Response.json(
        { error: `图片大小不能超过 ${Math.floor(MAX_IMAGE_SIZE / 1024 / 1024)}MB` },
        { status: 413 },
      );
    }

    const ext = getExtension(imageFile.name);
    if (!IMAGE_EXTENSIONS.has(ext)) {
      return Response.json(
        { error: "仅支持 png/jpg/jpeg/webp/avif/gif/svg" },
        { status: 400 },
      );
    }

    const objectKey = `theme/assets/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const uploadResult = await uploadToOss({
      objectKey,
      content: Buffer.from(await imageFile.arrayBuffer()),
      contentType: getImageContentType(ext),
    });

    await prisma.auditLog.create({
      data: createAuditLogInput({
        actorUserId: auth.user.id,
        action: "sakurairo.settings.upload_asset",
        targetType: "system",
        targetId: "sakurairo_theme",
        meta: {
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
      objectKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传图片失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
