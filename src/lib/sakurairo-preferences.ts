import { siteConfig } from "@/config/site";

export type LayoutMode = "default" | "github";
export type BgStyle = "mist" | "dream" | "paper";
export type MotionLevel = "normal" | "soft" | "none";
export type CommentStyle = "glass" | "plain";

export type SakurairoPreferences = {
  layoutMode: LayoutMode;
  bgStyle: BgStyle;
  motion: MotionLevel;
  titleAnim: boolean;
  commentStyle: CommentStyle;
  postTitleFontSizePx: number;
  copyAttributionEnabled: boolean;
  copyAttributionMinLength: number;
  commentPlaceholder: string;
  commentSubmitText: string;
};

export const SAKURAIRO_STORAGE_KEYS = {
  layoutMode: "sakurairo:layout-mode",
  bgStyle: "sakurairo:bg-style",
  motion: "sakurairo:motion",
  titleAnim: "sakurairo:title-anim",
  commentStyle: "sakurairo:comment-style",
  postTitleFontSizePx: "sakurairo:post-title-size",
  copyAttributionEnabled: "sakurairo:copy-attribution-enabled",
  copyAttributionMinLength: "sakurairo:copy-attribution-min-length",
  commentPlaceholder: "sakurairo:comment-placeholder",
  commentSubmitText: "sakurairo:comment-submit-text",
} as const;

export function getDefaultSakurairoPreferences(): SakurairoPreferences {
  return {
    layoutMode: siteConfig.sakurairo.pageLayoutStyle,
    bgStyle: "mist",
    motion: "normal",
    titleAnim: siteConfig.sakurairo.pageTitleAnimation,
    commentStyle: "glass",
    postTitleFontSizePx: siteConfig.sakurairo.postTitleFontSizePx,
    copyAttributionEnabled: siteConfig.sakurairo.addAttributionOnCopy,
    copyAttributionMinLength: siteConfig.sakurairo.copyAttributionMinLength,
    commentPlaceholder: siteConfig.sakurairo.commentPlaceholder,
    commentSubmitText: siteConfig.sakurairo.commentSubmitText,
  };
}

function parseIntInRange(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function readSakurairoPreferencesFromStorage(): SakurairoPreferences {
  const defaults = getDefaultSakurairoPreferences();
  if (typeof window === "undefined") {
    return defaults;
  }

  const layoutMode = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.layoutMode);
  const bgStyle = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.bgStyle);
  const motion = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.motion);
  const titleAnim = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.titleAnim);
  const commentStyle = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.commentStyle);
  const postTitleFontSizePx = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.postTitleFontSizePx);
  const copyAttributionEnabled = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.copyAttributionEnabled);
  const copyAttributionMinLength = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.copyAttributionMinLength);
  const commentPlaceholder = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.commentPlaceholder);
  const commentSubmitText = window.localStorage.getItem(SAKURAIRO_STORAGE_KEYS.commentSubmitText);

  return {
    layoutMode: layoutMode === "default" || layoutMode === "github" ? layoutMode : defaults.layoutMode,
    bgStyle: bgStyle === "mist" || bgStyle === "dream" || bgStyle === "paper" ? bgStyle : defaults.bgStyle,
    motion: motion === "normal" || motion === "soft" || motion === "none" ? motion : defaults.motion,
    titleAnim: titleAnim === null ? defaults.titleAnim : titleAnim === "true",
    commentStyle: commentStyle === "glass" || commentStyle === "plain" ? commentStyle : defaults.commentStyle,
    postTitleFontSizePx: parseIntInRange(postTitleFontSizePx, defaults.postTitleFontSizePx, 24, 44),
    copyAttributionEnabled:
      copyAttributionEnabled === null ? defaults.copyAttributionEnabled : copyAttributionEnabled === "true",
    copyAttributionMinLength: parseIntInRange(copyAttributionMinLength, defaults.copyAttributionMinLength, 10, 500),
    commentPlaceholder: commentPlaceholder?.trim() ? commentPlaceholder : defaults.commentPlaceholder,
    commentSubmitText: commentSubmitText?.trim() ? commentSubmitText : defaults.commentSubmitText,
  };
}

export function saveSakurairoPreferencesToStorage(preferences: SakurairoPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.layoutMode, preferences.layoutMode);
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.bgStyle, preferences.bgStyle);
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.motion, preferences.motion);
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.titleAnim, String(preferences.titleAnim));
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.commentStyle, preferences.commentStyle);
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.postTitleFontSizePx, String(preferences.postTitleFontSizePx));
  window.localStorage.setItem(
    SAKURAIRO_STORAGE_KEYS.copyAttributionEnabled,
    String(preferences.copyAttributionEnabled),
  );
  window.localStorage.setItem(
    SAKURAIRO_STORAGE_KEYS.copyAttributionMinLength,
    String(preferences.copyAttributionMinLength),
  );
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.commentPlaceholder, preferences.commentPlaceholder);
  window.localStorage.setItem(SAKURAIRO_STORAGE_KEYS.commentSubmitText, preferences.commentSubmitText);
}

export function saveSakurairoPreferenceToStorage<K extends keyof SakurairoPreferences>(
  key: K,
  value: SakurairoPreferences[K],
) {
  if (typeof window === "undefined") return;

  const mapping: Record<keyof SakurairoPreferences, string> = {
    layoutMode: SAKURAIRO_STORAGE_KEYS.layoutMode,
    bgStyle: SAKURAIRO_STORAGE_KEYS.bgStyle,
    motion: SAKURAIRO_STORAGE_KEYS.motion,
    titleAnim: SAKURAIRO_STORAGE_KEYS.titleAnim,
    commentStyle: SAKURAIRO_STORAGE_KEYS.commentStyle,
    postTitleFontSizePx: SAKURAIRO_STORAGE_KEYS.postTitleFontSizePx,
    copyAttributionEnabled: SAKURAIRO_STORAGE_KEYS.copyAttributionEnabled,
    copyAttributionMinLength: SAKURAIRO_STORAGE_KEYS.copyAttributionMinLength,
    commentPlaceholder: SAKURAIRO_STORAGE_KEYS.commentPlaceholder,
    commentSubmitText: SAKURAIRO_STORAGE_KEYS.commentSubmitText,
  };
  window.localStorage.setItem(mapping[key], String(value));
}

export function clearSakurairoPreferencesFromStorage() {
  if (typeof window === "undefined") return;
  Object.values(SAKURAIRO_STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function hasLocalOverride(key: keyof typeof SAKURAIRO_STORAGE_KEYS) {
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
  const cssPostTitleSize = root.style.getPropertyValue("--sakurairo-post-title-size").trim();
  const parsedSize = Number.parseInt(cssPostTitleSize.replace("px", ""), 10);
  const copyMinRaw = root.dataset.copyAttributionMinLength;
  const copyEnabledRaw = root.dataset.copyAttributionEnabled;

  return {
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
    titleAnim: !root.classList.contains("title-anim-off"),
    commentStyle: root.classList.contains("comment-plain") ? "plain" : "glass",
    postTitleFontSizePx: Number.isNaN(parsedSize) ? undefined : parsedSize,
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
  };
}

export function applySakurairoPreferencesToRoot(preferences: SakurairoPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("layout-github", preferences.layoutMode === "github");
  root.classList.toggle("title-anim-off", !preferences.titleAnim);
  root.classList.remove("motion-normal", "motion-soft", "motion-none");
  root.classList.add(`motion-${preferences.motion}`);
  root.classList.remove("comment-glass", "comment-plain");
  root.classList.add(`comment-${preferences.commentStyle}`);
  root.dataset.bgStyle = preferences.bgStyle;
  root.style.setProperty("--sakurairo-post-title-size", `${preferences.postTitleFontSizePx}px`);
  root.dataset.copyAttributionEnabled = String(preferences.copyAttributionEnabled);
  root.dataset.copyAttributionMinLength = String(preferences.copyAttributionMinLength);
  root.dataset.commentPlaceholder = preferences.commentPlaceholder;
  root.dataset.commentSubmitText = preferences.commentSubmitText;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sakurairo:preferences-change", {
        detail: preferences,
      }),
    );
  }
}
