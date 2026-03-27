import { siteConfig } from "@/config/site";

export type LayoutMode = "default" | "github";
export type BgStyle = "mist" | "dream" | "paper";
export type MotionLevel = "normal" | "soft" | "none";
export type CommentStyle = "glass" | "plain";
export type FooterMode = "auto" | "float" | "static";
export type LoginStyle = "default" | "sakurairo";

export type SakurairoPreferences = {
  // 初步设置
  preliminaryAvatarUrl: string;
  preliminaryWhiteCatText: boolean;
  preliminaryNavLogoUrl: string;
  preliminarySiteIconUrl: string;
  preliminarySeoKeywords: string;
  preliminarySeoDescription: string;

  // 全局设置
  layoutMode: LayoutMode;
  bgStyle: BgStyle;
  motion: MotionLevel;
  globalThemeSkin: string;
  globalThemeSkinMatching: string;
  globalFontWeight: number;
  globalMenuRadiusPx: number;
  globalWidgetTransparency: number;
  globalFrontTransparency: number;
  globalFooterMode: FooterMode;
  globalShowUtilityButtons: boolean;

  // 主页设置
  homepageHeroOverlayOpacity: number;
  homepageHeroInfoCardOpacity: number;
  homepageHeroTypingEffect: boolean;
  homepageHeroAutoBackgroundSec: number;
  homepageHeroShowSocial: boolean;
  homepageHeroShowStats: boolean;
  homepageHeroShowScrollHint: boolean;
  homepageHeroSignature: string;
  homepageHeroBackgroundUrl1: string;
  homepageHeroBackgroundUrl2: string;
  homepageHeroBackgroundUrl3: string;

  // 页面设置
  titleAnim: boolean;
  pageTitleDurationSec: number;
  commentStyle: CommentStyle;
  postTitleFontSizePx: number;
  pagePostTitleUnderline: boolean;
  pageShowToc: boolean;
  pageShowPostTags: boolean;
  pageShowPostNavigation: boolean;
  copyAttributionEnabled: boolean;
  copyAttributionMinLength: number;
  commentPlaceholder: string;
  commentSubmitText: string;

  // 其他设置
  othersLoginStyle: LoginStyle;
  othersLoginLogoUrl: string;
  othersLoginRedirectToAdmin: boolean;
};

export const SAKURAIRO_STORAGE_KEYS: Record<keyof SakurairoPreferences, string> = {
  preliminaryAvatarUrl: "sakurairo:preliminary-avatar-url",
  preliminaryWhiteCatText: "sakurairo:preliminary-white-cat-text",
  preliminaryNavLogoUrl: "sakurairo:preliminary-nav-logo-url",
  preliminarySiteIconUrl: "sakurairo:preliminary-site-icon-url",
  preliminarySeoKeywords: "sakurairo:preliminary-seo-keywords",
  preliminarySeoDescription: "sakurairo:preliminary-seo-description",

  layoutMode: "sakurairo:layout-mode",
  bgStyle: "sakurairo:bg-style",
  motion: "sakurairo:motion",
  globalThemeSkin: "sakurairo:global-theme-skin",
  globalThemeSkinMatching: "sakurairo:global-theme-skin-matching",
  globalFontWeight: "sakurairo:global-font-weight",
  globalMenuRadiusPx: "sakurairo:global-menu-radius",
  globalWidgetTransparency: "sakurairo:global-widget-transparency",
  globalFrontTransparency: "sakurairo:global-front-transparency",
  globalFooterMode: "sakurairo:global-footer-mode",
  globalShowUtilityButtons: "sakurairo:global-show-utility-buttons",

  homepageHeroOverlayOpacity: "sakurairo:homepage-hero-overlay-opacity",
  homepageHeroInfoCardOpacity: "sakurairo:homepage-hero-info-card-opacity",
  homepageHeroTypingEffect: "sakurairo:homepage-hero-typing-effect",
  homepageHeroAutoBackgroundSec: "sakurairo:homepage-hero-auto-bg-sec",
  homepageHeroShowSocial: "sakurairo:homepage-hero-show-social",
  homepageHeroShowStats: "sakurairo:homepage-hero-show-stats",
  homepageHeroShowScrollHint: "sakurairo:homepage-hero-show-scroll-hint",
  homepageHeroSignature: "sakurairo:homepage-hero-signature",
  homepageHeroBackgroundUrl1: "sakurairo:homepage-hero-bg-url-1",
  homepageHeroBackgroundUrl2: "sakurairo:homepage-hero-bg-url-2",
  homepageHeroBackgroundUrl3: "sakurairo:homepage-hero-bg-url-3",

  titleAnim: "sakurairo:title-anim",
  pageTitleDurationSec: "sakurairo:page-title-duration-sec",
  commentStyle: "sakurairo:comment-style",
  postTitleFontSizePx: "sakurairo:post-title-size",
  pagePostTitleUnderline: "sakurairo:page-post-title-underline",
  pageShowToc: "sakurairo:page-show-toc",
  pageShowPostTags: "sakurairo:page-show-post-tags",
  pageShowPostNavigation: "sakurairo:page-show-post-navigation",
  copyAttributionEnabled: "sakurairo:copy-attribution-enabled",
  copyAttributionMinLength: "sakurairo:copy-attribution-min-length",
  commentPlaceholder: "sakurairo:comment-placeholder",
  commentSubmitText: "sakurairo:comment-submit-text",

  othersLoginStyle: "sakurairo:others-login-style",
  othersLoginLogoUrl: "sakurairo:others-login-logo-url",
  othersLoginRedirectToAdmin: "sakurairo:others-login-redirect-to-admin",
} as const;

const PREFERENCE_KEYS = Object.keys(SAKURAIRO_STORAGE_KEYS) as (keyof SakurairoPreferences)[];

function parseIntInRange(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseFloatInRange(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseBoolean(value: string | null, fallback: boolean) {
  if (value === null) return fallback;
  return value === "true";
}

function parseOptionalCssVarNumber(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const normalized = value.trim().replace("px", "");
  return parseFloatInRange(normalized, fallback, min, max);
}

function parseOptionalDatasetBoolean(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function getDefaultSakurairoPreferences(): SakurairoPreferences {
  return {
    preliminaryAvatarUrl: siteConfig.sakurairo.preliminaryAvatarUrl,
    preliminaryWhiteCatText: siteConfig.sakurairo.preliminaryWhiteCatText,
    preliminaryNavLogoUrl: siteConfig.sakurairo.preliminaryNavLogoUrl,
    preliminarySiteIconUrl: siteConfig.sakurairo.preliminarySiteIconUrl,
    preliminarySeoKeywords: siteConfig.sakurairo.preliminarySeoKeywords,
    preliminarySeoDescription: siteConfig.sakurairo.preliminarySeoDescription,

    layoutMode: siteConfig.sakurairo.pageLayoutStyle,
    bgStyle: "mist",
    motion: "normal",
    globalThemeSkin: siteConfig.sakurairo.globalThemeSkin,
    globalThemeSkinMatching: siteConfig.sakurairo.globalThemeSkinMatching,
    globalFontWeight: siteConfig.sakurairo.globalFontWeight,
    globalMenuRadiusPx: siteConfig.sakurairo.globalMenuRadiusPx,
    globalWidgetTransparency: siteConfig.sakurairo.globalWidgetTransparency,
    globalFrontTransparency: siteConfig.sakurairo.globalFrontTransparency,
    globalFooterMode: siteConfig.sakurairo.globalFooterMode,
    globalShowUtilityButtons: siteConfig.sakurairo.globalShowUtilityButtons,

    homepageHeroOverlayOpacity: siteConfig.sakurairo.homepageHeroOverlayOpacity,
    homepageHeroInfoCardOpacity: siteConfig.sakurairo.homepageHeroInfoCardOpacity,
    homepageHeroTypingEffect: siteConfig.sakurairo.homepageHeroTypingEffect,
    homepageHeroAutoBackgroundSec: siteConfig.sakurairo.homepageHeroAutoBackgroundSec,
    homepageHeroShowSocial: siteConfig.sakurairo.homepageHeroShowSocial,
    homepageHeroShowStats: siteConfig.sakurairo.homepageHeroShowStats,
    homepageHeroShowScrollHint: siteConfig.sakurairo.homepageHeroShowScrollHint,
    homepageHeroSignature: siteConfig.sakurairo.homepageHeroSignature,
    homepageHeroBackgroundUrl1: siteConfig.sakurairo.homepageHeroBackgroundUrl1,
    homepageHeroBackgroundUrl2: siteConfig.sakurairo.homepageHeroBackgroundUrl2,
    homepageHeroBackgroundUrl3: siteConfig.sakurairo.homepageHeroBackgroundUrl3,

    titleAnim: siteConfig.sakurairo.pageTitleAnimation,
    pageTitleDurationSec: siteConfig.sakurairo.pageTitleAnimationDuration,
    commentStyle: "glass",
    postTitleFontSizePx: siteConfig.sakurairo.postTitleFontSizePx,
    pagePostTitleUnderline: siteConfig.sakurairo.postTitleUnderlineAnimation,
    pageShowToc: siteConfig.sakurairo.pageShowToc,
    pageShowPostTags: siteConfig.sakurairo.pageShowPostTags,
    pageShowPostNavigation: siteConfig.sakurairo.pageShowPostNavigation,
    copyAttributionEnabled: siteConfig.sakurairo.addAttributionOnCopy,
    copyAttributionMinLength: siteConfig.sakurairo.copyAttributionMinLength,
    commentPlaceholder: siteConfig.sakurairo.commentPlaceholder,
    commentSubmitText: siteConfig.sakurairo.commentSubmitText,

    othersLoginStyle: siteConfig.sakurairo.othersLoginStyle,
    othersLoginLogoUrl: siteConfig.sakurairo.othersLoginLogoUrl,
    othersLoginRedirectToAdmin: siteConfig.sakurairo.othersLoginRedirectToAdmin,
  };
}

export function readSakurairoPreferencesFromStorage(): SakurairoPreferences {
  const defaults = getDefaultSakurairoPreferences();
  if (typeof window === "undefined") {
    return defaults;
  }

  const get = (key: keyof SakurairoPreferences) =>
    window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS[key]);

  const layoutModeRaw = get("layoutMode");
  const bgStyleRaw = get("bgStyle");
  const motionRaw = get("motion");
  const commentStyleRaw = get("commentStyle");
  const footerModeRaw = get("globalFooterMode");
  const loginStyleRaw = get("othersLoginStyle");

  return {
    preliminaryAvatarUrl: get("preliminaryAvatarUrl")?.trim() || defaults.preliminaryAvatarUrl,
    preliminaryWhiteCatText: parseBoolean(
      get("preliminaryWhiteCatText"),
      defaults.preliminaryWhiteCatText,
    ),
    preliminaryNavLogoUrl: get("preliminaryNavLogoUrl")?.trim() || defaults.preliminaryNavLogoUrl,
    preliminarySiteIconUrl: get("preliminarySiteIconUrl")?.trim() || defaults.preliminarySiteIconUrl,
    preliminarySeoKeywords: get("preliminarySeoKeywords")?.trim() || defaults.preliminarySeoKeywords,
    preliminarySeoDescription:
      get("preliminarySeoDescription")?.trim() || defaults.preliminarySeoDescription,

    layoutMode:
      layoutModeRaw === "default" || layoutModeRaw === "github"
        ? layoutModeRaw
        : defaults.layoutMode,
    bgStyle:
      bgStyleRaw === "mist" || bgStyleRaw === "dream" || bgStyleRaw === "paper"
        ? bgStyleRaw
        : defaults.bgStyle,
    motion:
      motionRaw === "normal" || motionRaw === "soft" || motionRaw === "none"
        ? motionRaw
        : defaults.motion,
    globalThemeSkin: get("globalThemeSkin")?.trim() || defaults.globalThemeSkin,
    globalThemeSkinMatching:
      get("globalThemeSkinMatching")?.trim() || defaults.globalThemeSkinMatching,
    globalFontWeight: parseIntInRange(get("globalFontWeight"), defaults.globalFontWeight, 200, 500),
    globalMenuRadiusPx: parseIntInRange(get("globalMenuRadiusPx"), defaults.globalMenuRadiusPx, 6, 24),
    globalWidgetTransparency: parseFloatInRange(
      get("globalWidgetTransparency"),
      defaults.globalWidgetTransparency,
      0.3,
      1,
    ),
    globalFrontTransparency: parseFloatInRange(
      get("globalFrontTransparency"),
      defaults.globalFrontTransparency,
      0.3,
      1,
    ),
    globalFooterMode:
      footerModeRaw === "auto" || footerModeRaw === "float" || footerModeRaw === "static"
        ? footerModeRaw
        : defaults.globalFooterMode,
    globalShowUtilityButtons: parseBoolean(
      get("globalShowUtilityButtons"),
      defaults.globalShowUtilityButtons,
    ),

    homepageHeroOverlayOpacity: parseFloatInRange(
      get("homepageHeroOverlayOpacity"),
      defaults.homepageHeroOverlayOpacity,
      0,
      0.9,
    ),
    homepageHeroInfoCardOpacity: parseFloatInRange(
      get("homepageHeroInfoCardOpacity"),
      defaults.homepageHeroInfoCardOpacity,
      0.05,
      0.95,
    ),
    homepageHeroTypingEffect: parseBoolean(
      get("homepageHeroTypingEffect"),
      defaults.homepageHeroTypingEffect,
    ),
    homepageHeroAutoBackgroundSec: parseIntInRange(
      get("homepageHeroAutoBackgroundSec"),
      defaults.homepageHeroAutoBackgroundSec,
      0,
      120,
    ),
    homepageHeroShowSocial: parseBoolean(
      get("homepageHeroShowSocial"),
      defaults.homepageHeroShowSocial,
    ),
    homepageHeroShowStats: parseBoolean(
      get("homepageHeroShowStats"),
      defaults.homepageHeroShowStats,
    ),
    homepageHeroShowScrollHint: parseBoolean(
      get("homepageHeroShowScrollHint"),
      defaults.homepageHeroShowScrollHint,
    ),
    homepageHeroSignature: get("homepageHeroSignature")?.trim() || defaults.homepageHeroSignature,
    homepageHeroBackgroundUrl1:
      get("homepageHeroBackgroundUrl1")?.trim() || defaults.homepageHeroBackgroundUrl1,
    homepageHeroBackgroundUrl2:
      get("homepageHeroBackgroundUrl2")?.trim() || defaults.homepageHeroBackgroundUrl2,
    homepageHeroBackgroundUrl3:
      get("homepageHeroBackgroundUrl3")?.trim() || defaults.homepageHeroBackgroundUrl3,

    titleAnim: parseBoolean(get("titleAnim"), defaults.titleAnim),
    pageTitleDurationSec: parseFloatInRange(
      get("pageTitleDurationSec"),
      defaults.pageTitleDurationSec,
      0.3,
      5,
    ),
    commentStyle:
      commentStyleRaw === "glass" || commentStyleRaw === "plain"
        ? commentStyleRaw
        : defaults.commentStyle,
    postTitleFontSizePx: parseIntInRange(
      get("postTitleFontSizePx"),
      defaults.postTitleFontSizePx,
      24,
      44,
    ),
    pagePostTitleUnderline: parseBoolean(
      get("pagePostTitleUnderline"),
      defaults.pagePostTitleUnderline,
    ),
    pageShowToc: parseBoolean(get("pageShowToc"), defaults.pageShowToc),
    pageShowPostTags: parseBoolean(get("pageShowPostTags"), defaults.pageShowPostTags),
    pageShowPostNavigation: parseBoolean(
      get("pageShowPostNavigation"),
      defaults.pageShowPostNavigation,
    ),
    copyAttributionEnabled: parseBoolean(
      get("copyAttributionEnabled"),
      defaults.copyAttributionEnabled,
    ),
    copyAttributionMinLength: parseIntInRange(
      get("copyAttributionMinLength"),
      defaults.copyAttributionMinLength,
      10,
      500,
    ),
    commentPlaceholder: get("commentPlaceholder")?.trim() || defaults.commentPlaceholder,
    commentSubmitText: get("commentSubmitText")?.trim() || defaults.commentSubmitText,

    othersLoginStyle:
      loginStyleRaw === "default" || loginStyleRaw === "sakurairo"
        ? loginStyleRaw
        : defaults.othersLoginStyle,
    othersLoginLogoUrl: get("othersLoginLogoUrl")?.trim() || defaults.othersLoginLogoUrl,
    othersLoginRedirectToAdmin: parseBoolean(
      get("othersLoginRedirectToAdmin"),
      defaults.othersLoginRedirectToAdmin,
    ),
  };
}

export function saveSakurairoPreferencesToStorage(preferences: SakurairoPreferences) {
  if (typeof window === "undefined") return;
  PREFERENCE_KEYS.forEach((key) => {
    window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS[key], String(preferences[key]));
  });
}

export function saveSakurairoPreferenceToStorage<K extends keyof SakurairoPreferences>(
  key: K,
  value: SakurairoPreferences[K],
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS[key], String(value));
}

export function clearSakurairoPreferencesFromStorage() {
  if (typeof window === "undefined") return;
  PREFERENCE_KEYS.forEach((key) => {
    window.localStorage.removeItem(SAKURAIRO_STORAGE_KEYS[key]);
  });
}

export function hasLocalOverride(key: keyof SakurairoPreferences) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS[key]) !== null;
}

export function mergeSakurairoPreferences(
  base: SakurairoPreferences,
  patch?: Partial<SakurairoPreferences> | null,
) {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
  };
}

export function readSakurairoPreferencesFromRoot(): Partial<SakurairoPreferences> {
  if (typeof document === "undefined") return {};
  const root = document.documentElement;

  const copyEnabledRaw = root.dataset.copyAttributionEnabled;
  const copyMinRaw = root.dataset.copyAttributionMinLength;
  const postTitleSizeRaw = root.style.getPropertyValue("--sakurairo-post-title-size");
  const titleDurationRaw = root.style.getPropertyValue("--sakurairo-title-duration");
  const heroOverlayRaw = root.style.getPropertyValue("--sakurairo-hero-overlay-opacity");
  const heroInfoRaw = root.style.getPropertyValue("--sakurairo-hero-info-opacity");

  return {
    preliminaryAvatarUrl: root.dataset.preliminaryAvatarUrl || undefined,
    preliminaryWhiteCatText: parseOptionalDatasetBoolean(root.dataset.preliminaryWhiteCatText),
    preliminaryNavLogoUrl: root.dataset.preliminaryNavLogoUrl || undefined,
    preliminarySiteIconUrl: root.dataset.preliminarySiteIconUrl || undefined,
    preliminarySeoKeywords: root.dataset.preliminarySeoKeywords || undefined,
    preliminarySeoDescription: root.dataset.preliminarySeoDescription || undefined,

    layoutMode: root.classList.contains("layout-github") ? "github" : "default",
    bgStyle:
      root.dataset.bgStyle === "dream" || root.dataset.bgStyle === "paper"
        ? root.dataset.bgStyle
        : "mist",
    motion: root.classList.contains("motion-none")
      ? "none"
      : root.classList.contains("motion-soft")
        ? "soft"
        : "normal",
    globalThemeSkin: root.style.getPropertyValue("--theme-skin").trim() || undefined,
    globalThemeSkinMatching:
      root.style.getPropertyValue("--theme-skin-matching").trim() || undefined,
    globalFontWeight: parseOptionalCssVarNumber(
      root.style.getPropertyValue("--global-font-weight"),
      300,
      200,
      500,
    ),
    globalMenuRadiusPx: parseOptionalCssVarNumber(
      root.style.getPropertyValue("--style_menu_radius"),
      10,
      6,
      24,
    ),
    globalWidgetTransparency: parseOptionalCssVarNumber(
      root.style.getPropertyValue("--homepage_widget_transparency"),
      0.7,
      0.3,
      1,
    ),
    globalFrontTransparency: parseOptionalCssVarNumber(
      root.style.getPropertyValue("--front_background-transparency"),
      0.7,
      0.3,
      1,
    ),
    globalFooterMode:
      root.dataset.footerMode === "auto" ||
      root.dataset.footerMode === "float" ||
      root.dataset.footerMode === "static"
        ? root.dataset.footerMode
        : undefined,
    globalShowUtilityButtons: parseOptionalDatasetBoolean(root.dataset.globalShowUtilityButtons),

    homepageHeroOverlayOpacity: parseOptionalCssVarNumber(heroOverlayRaw, 0.56, 0, 0.9),
    homepageHeroInfoCardOpacity: parseOptionalCssVarNumber(heroInfoRaw, 0.18, 0.05, 0.95),
    homepageHeroTypingEffect: parseOptionalDatasetBoolean(root.dataset.homepageHeroTypingEffect),
    homepageHeroAutoBackgroundSec:
      root.dataset.homepageHeroAutoBackgroundSec !== undefined
        ? parseIntInRange(root.dataset.homepageHeroAutoBackgroundSec, 0, 0, 120)
        : undefined,
    homepageHeroShowSocial: parseOptionalDatasetBoolean(root.dataset.homepageHeroShowSocial),
    homepageHeroShowStats: parseOptionalDatasetBoolean(root.dataset.homepageHeroShowStats),
    homepageHeroShowScrollHint: parseOptionalDatasetBoolean(root.dataset.homepageHeroShowScrollHint),
    homepageHeroSignature: root.dataset.homepageHeroSignature || undefined,
    homepageHeroBackgroundUrl1: root.dataset.homepageHeroBackgroundUrl1 || undefined,
    homepageHeroBackgroundUrl2: root.dataset.homepageHeroBackgroundUrl2 || undefined,
    homepageHeroBackgroundUrl3: root.dataset.homepageHeroBackgroundUrl3 || undefined,

    titleAnim: !root.classList.contains("title-anim-off"),
    pageTitleDurationSec: parseOptionalCssVarNumber(titleDurationRaw, 1.2, 0.3, 5),
    commentStyle: root.classList.contains("comment-plain") ? "plain" : "glass",
    postTitleFontSizePx: parseOptionalCssVarNumber(postTitleSizeRaw, 34, 24, 44),
    pagePostTitleUnderline: parseOptionalDatasetBoolean(root.dataset.pagePostTitleUnderline),
    pageShowToc: parseOptionalDatasetBoolean(root.dataset.pageShowToc),
    pageShowPostTags: parseOptionalDatasetBoolean(root.dataset.pageShowPostTags),
    pageShowPostNavigation: parseOptionalDatasetBoolean(root.dataset.pageShowPostNavigation),
    copyAttributionEnabled:
      copyEnabledRaw === "true"
        ? true
        : copyEnabledRaw === "false"
          ? false
          : undefined,
    copyAttributionMinLength:
      copyMinRaw && !Number.isNaN(Number.parseInt(copyMinRaw, 10))
        ? Number.parseInt(copyMinRaw, 10)
        : undefined,
    commentPlaceholder: root.dataset.commentPlaceholder || undefined,
    commentSubmitText: root.dataset.commentSubmitText || undefined,

    othersLoginStyle:
      root.dataset.othersLoginStyle === "default" || root.dataset.othersLoginStyle === "sakurairo"
        ? root.dataset.othersLoginStyle
        : undefined,
    othersLoginLogoUrl: root.dataset.othersLoginLogoUrl || undefined,
    othersLoginRedirectToAdmin: parseOptionalDatasetBoolean(root.dataset.othersLoginRedirectToAdmin),
  };
}

export function readEffectiveSakurairoPreferencesFromRoot() {
  return mergeSakurairoPreferences(getDefaultSakurairoPreferences(), readSakurairoPreferencesFromRoot());
}

export function applySakurairoPreferencesToRoot(preferences: SakurairoPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.classList.toggle("layout-github", preferences.layoutMode === "github");
  root.classList.toggle("title-anim-off", !preferences.titleAnim);
  root.classList.toggle("sakurairo-white-cat-text", preferences.preliminaryWhiteCatText);
  root.classList.remove("motion-normal", "motion-soft", "motion-none");
  root.classList.add(`motion-${preferences.motion}`);
  root.classList.remove("comment-glass", "comment-plain");
  root.classList.add(`comment-${preferences.commentStyle}`);

  root.dataset.bgStyle = preferences.bgStyle;
  root.dataset.footerMode = preferences.globalFooterMode;
  root.dataset.globalShowUtilityButtons = String(preferences.globalShowUtilityButtons);

  root.dataset.preliminaryAvatarUrl = preferences.preliminaryAvatarUrl;
  root.dataset.preliminaryWhiteCatText = String(preferences.preliminaryWhiteCatText);
  root.dataset.preliminaryNavLogoUrl = preferences.preliminaryNavLogoUrl;
  root.dataset.preliminarySiteIconUrl = preferences.preliminarySiteIconUrl;
  root.dataset.preliminarySeoKeywords = preferences.preliminarySeoKeywords;
  root.dataset.preliminarySeoDescription = preferences.preliminarySeoDescription;

  root.dataset.homepageHeroTypingEffect = String(preferences.homepageHeroTypingEffect);
  root.dataset.homepageHeroAutoBackgroundSec = String(preferences.homepageHeroAutoBackgroundSec);
  root.dataset.homepageHeroShowSocial = String(preferences.homepageHeroShowSocial);
  root.dataset.homepageHeroShowStats = String(preferences.homepageHeroShowStats);
  root.dataset.homepageHeroShowScrollHint = String(preferences.homepageHeroShowScrollHint);
  root.dataset.homepageHeroSignature = preferences.homepageHeroSignature;
  root.dataset.homepageHeroBackgroundUrl1 = preferences.homepageHeroBackgroundUrl1;
  root.dataset.homepageHeroBackgroundUrl2 = preferences.homepageHeroBackgroundUrl2;
  root.dataset.homepageHeroBackgroundUrl3 = preferences.homepageHeroBackgroundUrl3;

  root.dataset.pagePostTitleUnderline = String(preferences.pagePostTitleUnderline);
  root.dataset.pageShowToc = String(preferences.pageShowToc);
  root.dataset.pageShowPostTags = String(preferences.pageShowPostTags);
  root.dataset.pageShowPostNavigation = String(preferences.pageShowPostNavigation);

  root.dataset.copyAttributionEnabled = String(preferences.copyAttributionEnabled);
  root.dataset.copyAttributionMinLength = String(preferences.copyAttributionMinLength);
  root.dataset.commentPlaceholder = preferences.commentPlaceholder;
  root.dataset.commentSubmitText = preferences.commentSubmitText;

  root.dataset.othersLoginStyle = preferences.othersLoginStyle;
  root.dataset.othersLoginLogoUrl = preferences.othersLoginLogoUrl;
  root.dataset.othersLoginRedirectToAdmin = String(preferences.othersLoginRedirectToAdmin);

  root.style.setProperty("--theme-skin", preferences.globalThemeSkin);
  root.style.setProperty("--theme-skin-matching", preferences.globalThemeSkinMatching);
  root.style.setProperty("--global-font-weight", String(preferences.globalFontWeight));
  root.style.setProperty("--style_menu_radius", `${preferences.globalMenuRadiusPx}px`);
  root.style.setProperty(
    "--homepage_widget_transparency",
    String(preferences.globalWidgetTransparency),
  );
  root.style.setProperty(
    "--front_background-transparency",
    String(preferences.globalFrontTransparency),
  );
  root.style.setProperty("--sakurairo-post-title-size", `${preferences.postTitleFontSizePx}px`);
  root.style.setProperty("--sakurairo-title-duration", `${preferences.pageTitleDurationSec}s`);
  root.style.setProperty(
    "--sakurairo-hero-overlay-opacity",
    String(preferences.homepageHeroOverlayOpacity),
  );
  root.style.setProperty(
    "--sakurairo-hero-info-opacity",
    String(preferences.homepageHeroInfoCardOpacity),
  );

  if (preferences.preliminarySiteIconUrl) {
    const icon =
      document.querySelector("link[rel='icon']") ??
      document.createElement("link");
    icon.setAttribute("rel", "icon");
    icon.setAttribute("href", preferences.preliminarySiteIconUrl);
    if (!icon.parentNode) {
      document.head.appendChild(icon);
    }
  }

  if (preferences.preliminarySeoKeywords) {
    const keywordsMeta =
      document.querySelector("meta[name='keywords']") ??
      document.createElement("meta");
    keywordsMeta.setAttribute("name", "keywords");
    keywordsMeta.setAttribute("content", preferences.preliminarySeoKeywords);
    if (!keywordsMeta.parentNode) {
      document.head.appendChild(keywordsMeta);
    }
  }

  if (preferences.preliminarySeoDescription) {
    const descriptionMeta = document.querySelector("meta[name='description']");
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", preferences.preliminarySeoDescription);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sakurairo:preferences-change", {
        detail: preferences,
      }),
    );
  }
}
