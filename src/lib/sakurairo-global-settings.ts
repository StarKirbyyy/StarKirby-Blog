import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getDefaultSakurairoPreferences,
  mergeSakurairoPreferences,
  type SakurairoPreferences,
} from "@/lib/sakurairo-preferences";

export const SAKURAIRO_GLOBAL_SETTING_KEY = "sakurairo_theme";

type GlobalSakurairoPatchResult = {
  patch: Partial<SakurairoPreferences> | null;
  persisted: boolean;
};

function isMissingTableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021";
  }
  const message = error instanceof Error ? error.message : String(error);
  return /does not exist/i.test(message) && /GlobalSetting/i.test(message);
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function sanitizeSakurairoPatch(
  input: unknown,
): Partial<SakurairoPreferences> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const patch: Partial<SakurairoPreferences> = {};

  if (raw.layoutMode === "default" || raw.layoutMode === "github") {
    patch.layoutMode = raw.layoutMode;
  }
  if (raw.bgStyle === "mist" || raw.bgStyle === "dream" || raw.bgStyle === "paper") {
    patch.bgStyle = raw.bgStyle;
  }
  if (raw.motion === "normal" || raw.motion === "soft" || raw.motion === "none") {
    patch.motion = raw.motion;
  }
  if (typeof raw.titleAnim === "boolean") {
    patch.titleAnim = raw.titleAnim;
  }
  if (raw.commentStyle === "glass" || raw.commentStyle === "plain") {
    patch.commentStyle = raw.commentStyle;
  }
  if (typeof raw.postTitleFontSizePx === "number" && Number.isFinite(raw.postTitleFontSizePx)) {
    patch.postTitleFontSizePx = clampInt(raw.postTitleFontSizePx, 24, 44);
  }
  if (typeof raw.copyAttributionEnabled === "boolean") {
    patch.copyAttributionEnabled = raw.copyAttributionEnabled;
  }
  if (typeof raw.copyAttributionMinLength === "number" && Number.isFinite(raw.copyAttributionMinLength)) {
    patch.copyAttributionMinLength = clampInt(raw.copyAttributionMinLength, 10, 500);
  }
  if (typeof raw.commentPlaceholder === "string" && raw.commentPlaceholder.trim()) {
    patch.commentPlaceholder = raw.commentPlaceholder.trim();
  }
  if (typeof raw.commentSubmitText === "string" && raw.commentSubmitText.trim()) {
    patch.commentSubmitText = raw.commentSubmitText.trim();
  }

  return patch;
}

async function getGlobalSakurairoPatchResult(): Promise<GlobalSakurairoPatchResult> {
  try {
    const record = await prisma.globalSetting.findUnique({
      where: { key: SAKURAIRO_GLOBAL_SETTING_KEY },
    });
    if (!record?.value || typeof record.value !== "object") {
      return {
        patch: null,
        persisted: true,
      };
    }
    return {
      patch: sanitizeSakurairoPatch(record.value),
      persisted: true,
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        patch: null,
        persisted: false,
      };
    }
    throw error;
  }
}

export async function getGlobalSakurairoPatch() {
  const result = await getGlobalSakurairoPatchResult();
  return result.patch;
}

export async function getGlobalSakurairoPreferences() {
  const defaults = getDefaultSakurairoPreferences();
  const result = await getGlobalSakurairoPatchResult();
  return mergeSakurairoPreferences(defaults, result.patch);
}

export async function getGlobalSakurairoPreferencesWithMeta() {
  const defaults = getDefaultSakurairoPreferences();
  const result = await getGlobalSakurairoPatchResult();
  return {
    settings: mergeSakurairoPreferences(defaults, result.patch),
    persisted: result.persisted,
  };
}

export async function updateGlobalSakurairoSettings(
  patch: Partial<SakurairoPreferences>,
  actorUserId?: string | null,
) {
  const sanitizedPatch = sanitizeSakurairoPatch(patch);
  const merged = mergeSakurairoPreferences(
    await getGlobalSakurairoPreferences(),
    sanitizedPatch,
  );

  try {
    await prisma.$transaction([
      prisma.globalSetting.upsert({
        where: { key: SAKURAIRO_GLOBAL_SETTING_KEY },
        update: { value: merged as Prisma.InputJsonValue },
        create: {
          key: SAKURAIRO_GLOBAL_SETTING_KEY,
          value: merged as Prisma.InputJsonValue,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: actorUserId ?? null,
          action: "sakurairo.settings.update",
          targetType: "GlobalSetting",
          targetId: SAKURAIRO_GLOBAL_SETTING_KEY,
          meta: {
            patch: sanitizedPatch,
          },
        },
      }),
    ]);
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        settings: merged,
        persisted: false,
      };
    }
    throw error;
  }

  return {
    settings: merged,
    persisted: true,
  };
}
