import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getGlobalSakurairoPreferencesWithMeta,
  sanitizeSakurairoPatch,
  updateGlobalSakurairoSettings,
} from "@/lib/sakurairo-global-settings";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const result = await getGlobalSakurairoPreferencesWithMeta();
  return Response.json({
    settings: result.settings,
    persisted: result.persisted,
    warning: result.persisted
      ? null
      : "GlobalSetting 表不存在，当前设置未持久化。请先执行 prisma migrate deploy。",
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const auth = getAdminUserOrError(session);
  if (auth.error) return auth.error;

  const json = (await request.json().catch(() => null)) as {
    settings?: unknown;
  } | null;
  const patch = sanitizeSakurairoPatch(json?.settings);
  const result = await updateGlobalSakurairoSettings(patch, auth.user.id);

  return Response.json({
    success: true,
    settings: result.settings,
    persisted: result.persisted,
    warning: result.persisted
      ? null
      : "GlobalSetting 表不存在，当前设置未持久化。请先执行 prisma migrate deploy。",
  });
}
