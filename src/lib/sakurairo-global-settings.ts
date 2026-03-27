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

function clampFloat(value: number, min: number, max: number, fixed = 2) {
  const next = Math.min(max, Math.max(min, value));
  return Number(next.toFixed(fixed));
}

function sanitizeString(
  value: unknown,
  options?: { allowEmpty?: boolean; maxLength?: number },
) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  const maxLength = options?.maxLength ?? 2000;
  if (!trimmed && !options?.allowEmpty) return undefined;
  return trimmed.slice(0, maxLength);
}

export function sanitizeSakurairoPatch(
  input: unknown,
): Partial<SakurairoPreferences> {
  const raw = (input ?? {}) as Record<string, unknown>;
  const patch: Partial<SakurairoPreferences> = {};

  const preliminaryAvatarUrl = sanitizeString(raw.preliminaryAvatarUrl, {
    allowEmpty: true,
    maxLength: 512,
  });
  if (preliminaryAvatarUrl !== undefined) {
    patch.preliminaryAvatarUrl = preliminaryAvatarUrl;
  }
  if (typeof raw.preliminaryWhiteCatText === "boolean") {
    patch.preliminaryWhiteCatText = raw.preliminaryWhiteCatText;
  }
  const preliminaryNavLogoUrl = sanitizeString(raw.preliminaryNavLogoUrl, {
    allowEmpty: true,
    maxLength: 512,
  });
  if (preliminaryNavLogoUrl !== undefined) {
    patch.preliminaryNavLogoUrl = preliminaryNavLogoUrl;
  }
  const preliminarySiteIconUrl = sanitizeString(raw.preliminarySiteIconUrl, {
    allowEmpty: true,
    maxLength: 512,
  });
  if (preliminarySiteIconUrl !== undefined) {
    patch.preliminarySiteIconUrl = preliminarySiteIconUrl;
  }
  const preliminarySeoKeywords = sanitizeString(raw.preliminarySeoKeywords, {
    allowEmpty: true,
    maxLength: 500,
  });
  if (preliminarySeoKeywords !== undefined) {
    patch.preliminarySeoKeywords = preliminarySeoKeywords;
  }
  const preliminarySeoDescription = sanitizeString(raw.preliminarySeoDescription, {
    allowEmpty: true,
    maxLength: 300,
  });
  if (preliminarySeoDescription !== undefined) {
    patch.preliminarySeoDescription = preliminarySeoDescription;
  }

  if (raw.layoutMode === "default" || raw.layoutMode === "github") {
    patch.layoutMode = raw.layoutMode;
  }
  if (raw.bgStyle === "mist" || raw.bgStyle === "dream" || raw.bgStyle === "paper") {
    patch.bgStyle = raw.bgStyle;
  }
  if (raw.motion === "normal" || raw.motion === "soft" || raw.motion === "none") {
    patch.motion = raw.motion;
  }
  const globalThemeSkin = sanitizeString(raw.globalThemeSkin, { maxLength: 32 });
  if (globalThemeSkin !== undefined) {
    patch.globalThemeSkin = globalThemeSkin;
  }
  const globalThemeSkinMatching = sanitizeString(raw.globalThemeSkinMatching, {
    maxLength: 32,
  });
  if (globalThemeSkinMatching !== undefined) {
    patch.globalThemeSkinMatching = globalThemeSkinMatching;
  }
  if (typeof raw.globalFontWeight === "number" && Number.isFinite(raw.globalFontWeight)) {
    patch.globalFontWeight = clampInt(raw.globalFontWeight, 200, 500);
  }
  if (typeof raw.globalMenuRadiusPx === "number" && Number.isFinite(raw.globalMenuRadiusPx)) {
    patch.globalMenuRadiusPx = clampInt(raw.globalMenuRadiusPx, 6, 24);
  }
  if (
    typeof raw.globalWidgetTransparency === "number" &&
    Number.isFinite(raw.globalWidgetTransparency)
  ) {
    patch.globalWidgetTransparency = clampFloat(raw.globalWidgetTransparency, 0.3, 1);
  }
  if (
    typeof raw.globalFrontTransparency === "number" &&
    Number.isFinite(raw.globalFrontTransparency)
  ) {
    patch.globalFrontTransparency = clampFloat(raw.globalFrontTransparency, 0.3, 1);
  }
  if (raw.globalFooterMode === "auto" || raw.globalFooterMode === "float" || raw.globalFooterMode === "static") {
    patch.globalFooterMode = raw.globalFooterMode;
  }
  if (typeof raw.globalShowUtilityButtons === "boolean") {
    patch.globalShowUtilityButtons = raw.globalShowUtilityButtons;
  }

  if (
    typeof raw.homepageHeroOverlayOpacity === "number" &&
    Number.isFinite(raw.homepageHeroOverlayOpacity)
  ) {
    patch.homepageHeroOverlayOpacity = clampFloat(raw.homepageHeroOverlayOpacity, 0, 0.9);
  }
  if (
    typeof raw.homepageHeroInfoCardOpacity === "number" &&
    Number.isFinite(raw.homepageHeroInfoCardOpacity)
  ) {
    patch.homepageHeroInfoCardOpacity = clampFloat(raw.homepageHeroInfoCardOpacity, 0.05, 0.95);
  }
  if (typeof raw.homepageHeroTypingEffect === "boolean") {
    patch.homepageHeroTypingEffect = raw.homepageHeroTypingEffect;
  }
  if (
    typeof raw.homepageHeroAutoBackgroundSec === "number" &&
    Number.isFinite(raw.homepageHeroAutoBackgroundSec)
  ) {
    patch.homepageHeroAutoBackgroundSec = clampInt(raw.homepageHeroAutoBackgroundSec, 0, 120);
  }
  if (typeof raw.homepageHeroShowSocial === "boolean") {
    patch.homepageHeroShowSocial = raw.homepageHeroShowSocial;
  }
  if (typeof raw.homepageHeroShowStats === "boolean") {
    patch.homepageHeroShowStats = raw.homepageHeroShowStats;
  }
  if (typeof raw.homepageHeroShowScrollHint === "boolean") {
    patch.homepageHeroShowScrollHint = raw.homepageHeroShowScrollHint;
  }
  const homepageHeroSignature = sanitizeString(raw.homepageHeroSignature, {
    allowEmpty: true,
    maxLength: 200,
  });
  if (homepageHeroSignature !== undefined) {
    patch.homepageHeroSignature = homepageHeroSignature;
  }

  if (typeof raw.titleAnim === "boolean") {
    patch.titleAnim = raw.titleAnim;
  }
  if (typeof raw.pageTitleDurationSec === "number" && Number.isFinite(raw.pageTitleDurationSec)) {
    patch.pageTitleDurationSec = clampFloat(raw.pageTitleDurationSec, 0.3, 5, 1);
  }
  if (raw.commentStyle === "glass" || raw.commentStyle === "plain") {
    patch.commentStyle = raw.commentStyle;
  }
  if (typeof raw.postTitleFontSizePx === "number" && Number.isFinite(raw.postTitleFontSizePx)) {
    patch.postTitleFontSizePx = clampInt(raw.postTitleFontSizePx, 24, 44);
  }
  if (typeof raw.pagePostTitleUnderline === "boolean") {
    patch.pagePostTitleUnderline = raw.pagePostTitleUnderline;
  }
  if (typeof raw.pageShowToc === "boolean") {
    patch.pageShowToc = raw.pageShowToc;
  }
  if (typeof raw.pageShowPostTags === "boolean") {
    patch.pageShowPostTags = raw.pageShowPostTags;
  }
  if (typeof raw.pageShowPostNavigation === "boolean") {
    patch.pageShowPostNavigation = raw.pageShowPostNavigation;
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

  if (raw.othersLoginStyle === "default" || raw.othersLoginStyle === "sakurairo") {
    patch.othersLoginStyle = raw.othersLoginStyle;
  }
  const othersLoginLogoUrl = sanitizeString(raw.othersLoginLogoUrl, {
    allowEmpty: true,
    maxLength: 512,
  });
  if (othersLoginLogoUrl !== undefined) {
    patch.othersLoginLogoUrl = othersLoginLogoUrl;
  }
  if (typeof raw.othersLoginRedirectToAdmin === "boolean") {
    patch.othersLoginRedirectToAdmin = raw.othersLoginRedirectToAdmin;
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
