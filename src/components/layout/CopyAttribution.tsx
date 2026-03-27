"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";
import {
  getDefaultSakurairoPreferences,
  readSakurairoPreferencesFromRoot,
} from "@/lib/sakurairo-preferences";

export function CopyAttribution() {
  useEffect(() => {
    const defaults = getDefaultSakurairoPreferences();

    const resolveEffectiveSettings = () => {
      const root = readSakurairoPreferencesFromRoot();
      return {
        enabled: root.copyAttributionEnabled ?? defaults.copyAttributionEnabled,
        minLength: root.copyAttributionMinLength ?? defaults.copyAttributionMinLength,
      };
    };

    const onCopy = (event: ClipboardEvent) => {
      const effective = resolveEffectiveSettings();
      if (!effective.enabled) return;

      const selection = window.getSelection()?.toString().trim() ?? "";
      if (!selection) return;
      if (selection.length < effective.minLength) return;

      const citation = [
        "",
        "",
        `ref(APA): ${siteConfig.author.name}. ${siteConfig.name}. ${siteConfig.url}.`,
      ].join("\n");
      const payload = `${selection}${citation}`;

      if (event.clipboardData) {
        event.preventDefault();
        event.clipboardData.setData("text/plain", payload);
      }
    };

    document.addEventListener("copy", onCopy);
    return () => document.removeEventListener("copy", onCopy);
  }, []);

  return null;
}
