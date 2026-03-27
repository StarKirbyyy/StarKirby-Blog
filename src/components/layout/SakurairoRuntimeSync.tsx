"use client";

import { useEffect } from "react";
import {
  applySakurairoPreferencesToRoot,
  getDefaultSakurairoPreferences,
  hasLocalOverride,
  mergeSakurairoPreferences,
  readSakurairoPreferencesFromStorage,
  type SakurairoPreferences,
} from "@/lib/sakurairo-preferences";

type ThemeSettingsApiResponse = {
  settings?: Partial<SakurairoPreferences> | null;
};

const URL_OVERRIDE_KEYS = new Set<keyof SakurairoPreferences>([
  "preliminaryAvatarUrl",
  "preliminaryNavLogoUrl",
  "preliminarySiteIconUrl",
  "globalBackgroundImageUrl",
  "homepageHeroBackgroundUrl1",
  "homepageHeroBackgroundUrl2",
  "homepageHeroBackgroundUrl3",
  "othersLoginLogoUrl",
]);

export function SakurairoRuntimeSync() {
  useEffect(() => {
    let active = true;
    const defaults = getDefaultSakurairoPreferences();
    const local = readSakurairoPreferencesFromStorage();

    // 先应用本地覆盖，避免视觉回跳。
    applySakurairoPreferencesToRoot(local);

    const syncRemoteSettings = async () => {
      try {
        const response = await fetch("/api/theme/settings", {
          cache: "no-store",
        });
        if (!response.ok || !active) return;

        const json = (await response.json()) as ThemeSettingsApiResponse;
        const remote = mergeSakurairoPreferences(defaults, json.settings);

        const localOverrides: Partial<SakurairoPreferences> = {};
        (Object.keys(remote) as (keyof SakurairoPreferences)[]).forEach((key) => {
          if (!hasLocalOverride(key)) return;
          const localValue = local[key];
          if (
            URL_OVERRIDE_KEYS.has(key) &&
            typeof localValue === "string" &&
            !localValue.trim()
          ) {
            return;
          }
          (localOverrides as Record<string, unknown>)[key] = localValue;
        });

        const merged = mergeSakurairoPreferences(remote, localOverrides);
        if (!active) return;
        applySakurairoPreferencesToRoot(merged);
      } catch {
        // ignore network failures; keep local/default settings
      }
    };

    void syncRemoteSettings();

    return () => {
      active = false;
    };
  }, []);

  return null;
}
