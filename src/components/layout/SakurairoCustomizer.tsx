"use client";

import { useEffect, useState } from "react";
import {
  applySakurairoPreferencesToRoot,
  clearSakurairoPreferencesFromStorage,
  getDefaultSakurairoPreferences,
  hasLocalOverride,
  mergeSakurairoPreferences,
  readSakurairoPreferencesFromStorage,
  saveSakurairoPreferenceToStorage,
  type SakurairoPreferences,
} from "@/lib/sakurairo-preferences";

export function SakurairoCustomizer() {
  const defaults = getDefaultSakurairoPreferences();
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<SakurairoPreferences>(defaults);
  const [globalDefaults, setGlobalDefaults] = useState<SakurairoPreferences>(defaults);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const local = readSakurairoPreferencesFromStorage();
    setPreferences(local);
    applySakurairoPreferencesToRoot(local);

    const loadGlobalDefaults = async () => {
      setSyncing(true);
      try {
        const response = await fetch("/api/theme/settings", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const json = (await response.json()) as {
          settings?: Partial<SakurairoPreferences>;
        };
        const remote = mergeSakurairoPreferences(defaults, json.settings);
        setGlobalDefaults(remote);

        const localOverrides: Partial<SakurairoPreferences> = {};
        (Object.keys(remote) as (keyof SakurairoPreferences)[]).forEach((key) => {
          if (hasLocalOverride(key)) {
            (localOverrides as Record<string, unknown>)[key] = local[key];
          }
        });
        const merged = mergeSakurairoPreferences(remote, localOverrides);

        setPreferences(merged);
      } finally {
        setSyncing(false);
      }
    };

    void loadGlobalDefaults();
  }, []);

  useEffect(() => {
    applySakurairoPreferencesToRoot(preferences);
  }, [preferences]);

  const updatePreference = <K extends keyof SakurairoPreferences>(
    key: K,
    value: SakurairoPreferences[K],
  ) => {
    saveSakurairoPreferenceToStorage(key, value);
    setPreferences((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <div className="pointer-events-none fixed bottom-[9.2rem] right-3 z-30 sm:bottom-[9.8rem] sm:right-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-[10px] border border-border/70 bg-surface-soft text-muted-fg shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:text-foreground"
        aria-label={open ? "关闭风格设置面板" : "打开风格设置面板"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
        </svg>
      </button>

      {open ? (
        <section className="pointer-events-auto mt-2 w-[280px] rounded-[10px] border border-border bg-surface p-3 shadow-[var(--shadow-float)] backdrop-blur-xl">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-fg">Sakurairo 设置</p>

          <label className="mt-2 block text-xs text-muted-fg">
            排版风格
            <select
              className="mt-1 w-full rounded-[8px] border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground"
              value={preferences.layoutMode}
              onChange={(event) => updatePreference("layoutMode", event.target.value as SakurairoPreferences["layoutMode"])}
            >
              <option value="default">默认</option>
              <option value="github">GitHub 文档风格</option>
            </select>
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            背景风格
            <select
              className="mt-1 w-full rounded-[8px] border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground"
              value={preferences.bgStyle}
              onChange={(event) => updatePreference("bgStyle", event.target.value as SakurairoPreferences["bgStyle"])}
            >
              <option value="mist">薄雾</option>
              <option value="dream">梦境</option>
              <option value="paper">纸张</option>
            </select>
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            动效强度
            <select
              className="mt-1 w-full rounded-[8px] border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground"
              value={preferences.motion}
              onChange={(event) => updatePreference("motion", event.target.value as SakurairoPreferences["motion"])}
            >
              <option value="normal">标准</option>
              <option value="soft">柔和</option>
              <option value="none">关闭</option>
            </select>
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            评论区样式
            <select
              className="mt-1 w-full rounded-[8px] border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground"
              value={preferences.commentStyle}
              onChange={(event) => updatePreference("commentStyle", event.target.value as SakurairoPreferences["commentStyle"])}
            >
              <option value="glass">玻璃态</option>
              <option value="plain">纯色</option>
            </select>
          </label>

          <label className="mt-2 flex items-center gap-2 text-xs text-muted-fg">
            <input
              type="checkbox"
              checked={preferences.titleAnim}
              onChange={(event) => updatePreference("titleAnim", event.target.checked)}
            />
            启用页面标题动画
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            文章标题字号：{preferences.postTitleFontSizePx}px
            <input
              type="range"
              min={28}
              max={40}
              step={1}
              className="mt-1 w-full"
              value={preferences.postTitleFontSizePx}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                updatePreference("postTitleFontSizePx", Number.isNaN(value) ? defaults.postTitleFontSizePx : value);
              }}
            />
          </label>

          <label className="mt-2 flex items-center gap-2 text-xs text-muted-fg">
            <input
              type="checkbox"
              checked={preferences.copyAttributionEnabled}
              onChange={(event) => updatePreference("copyAttributionEnabled", event.target.checked)}
            />
            复制附带引用
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            引用触发长度：{preferences.copyAttributionMinLength}
            <input
              type="range"
              min={20}
              max={200}
              step={5}
              className="mt-1 w-full"
              value={preferences.copyAttributionMinLength}
              onChange={(event) => {
                const value = Number.parseInt(event.target.value, 10);
                updatePreference(
                  "copyAttributionMinLength",
                  Number.isNaN(value) ? defaults.copyAttributionMinLength : value,
                );
              }}
            />
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            评论占位文案
            <input
              type="text"
              value={preferences.commentPlaceholder}
              onChange={(event) => updatePreference("commentPlaceholder", event.target.value)}
              className="mt-1 w-full rounded-[8px] border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground"
              placeholder={defaults.commentPlaceholder}
            />
          </label>

          <label className="mt-2 block text-xs text-muted-fg">
            评论按钮文案
            <input
              type="text"
              value={preferences.commentSubmitText}
              onChange={(event) => updatePreference("commentSubmitText", event.target.value)}
              className="mt-1 w-full rounded-[8px] border border-border/70 bg-background px-2 py-1.5 text-sm text-foreground"
              placeholder={defaults.commentSubmitText}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              clearSakurairoPreferencesFromStorage();
              setPreferences(globalDefaults);
            }}
            className="mt-3 inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-xs text-muted-fg transition-colors hover:text-foreground"
          >
            使用站点默认
          </button>
          {syncing ? <p className="mt-2 text-[11px] text-muted-fg">同步站点默认中...</p> : null}
        </section>
      ) : null}
    </div>
  );
}
