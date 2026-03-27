"use client";

import { useEffect, useState } from "react";
import {
  getDefaultSakurairoPreferences,
  mergeSakurairoPreferences,
  type SakurairoPreferences,
} from "@/lib/sakurairo-preferences";

type ThemeSettingsResponse = {
  settings?: Partial<SakurairoPreferences>;
  persisted?: boolean;
  warning?: string | null;
  error?: string;
};

const DEFAULT_SETTINGS = getDefaultSakurairoPreferences();

export function ThemeSettingsPanel() {
  const [settings, setSettings] = useState<SakurairoPreferences>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError("");
      setMessage("");
      setWarning("");
      try {
        const response = await fetch("/api/admin/theme/settings", {
          cache: "no-store",
        });
        const json = (await response.json()) as ThemeSettingsResponse;
        if (!response.ok) {
          throw new Error(json.error || "主题设置加载失败");
        }
        setSettings(mergeSakurairoPreferences(DEFAULT_SETTINGS, json.settings));
        if (json.persisted === false) {
          setWarning(
            json.warning ||
              "GlobalSetting 表不存在，当前设置未持久化。请先执行 prisma migrate deploy。",
          );
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "主题设置加载失败");
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const updateSetting = <K extends keyof SakurairoPreferences>(
    key: K,
    value: SakurairoPreferences[K],
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    setWarning("");
    try {
      const response = await fetch("/api/admin/theme/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings,
        }),
      });
      const json = (await response.json()) as ThemeSettingsResponse;
      if (!response.ok) {
        throw new Error(json.error || "主题设置保存失败");
      }
      setSettings(mergeSakurairoPreferences(DEFAULT_SETTINGS, json.settings));
      if (json.persisted === false) {
        setWarning(
          json.warning ||
            "GlobalSetting 表不存在，当前设置未持久化。请先执行 prisma migrate deploy。",
        );
      } else {
        setMessage("主题设置已保存。访客刷新页面后将跟随新默认值。");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "主题设置保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          主题设置
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          配置站点级 Sakurairo 默认值。访客可在前台做本地覆盖，未覆盖字段会跟随这里的设置。
        </p>
      </header>

      <section className="glass-panel mt-6 rounded-[10px] p-5 sm:p-6">
        {loading ? (
          <p className="text-sm text-muted-fg">主题设置加载中...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs text-muted-fg">
                排版风格
                <select
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  value={settings.layoutMode}
                  onChange={(event) =>
                    updateSetting(
                      "layoutMode",
                      event.target.value as SakurairoPreferences["layoutMode"],
                    )
                  }
                >
                  <option value="default">Default</option>
                  <option value="github">GitHub</option>
                </select>
              </label>

              <label className="block text-xs text-muted-fg">
                背景风格
                <select
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  value={settings.bgStyle}
                  onChange={(event) =>
                    updateSetting(
                      "bgStyle",
                      event.target.value as SakurairoPreferences["bgStyle"],
                    )
                  }
                >
                  <option value="mist">Mist</option>
                  <option value="dream">Dream</option>
                  <option value="paper">Paper</option>
                </select>
              </label>

              <label className="block text-xs text-muted-fg">
                动效强度
                <select
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  value={settings.motion}
                  onChange={(event) =>
                    updateSetting(
                      "motion",
                      event.target.value as SakurairoPreferences["motion"],
                    )
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="soft">Soft</option>
                  <option value="none">None</option>
                </select>
              </label>

              <label className="block text-xs text-muted-fg">
                评论区样式
                <select
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  value={settings.commentStyle}
                  onChange={(event) =>
                    updateSetting(
                      "commentStyle",
                      event.target.value as SakurairoPreferences["commentStyle"],
                    )
                  }
                >
                  <option value="glass">Glass</option>
                  <option value="plain">Plain</option>
                </select>
              </label>

              <label className="block text-xs text-muted-fg">
                文章标题字号：{settings.postTitleFontSizePx}px
                <input
                  type="range"
                  min={24}
                  max={44}
                  step={1}
                  className="mt-1 w-full"
                  value={settings.postTitleFontSizePx}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    updateSetting(
                      "postTitleFontSizePx",
                      Number.isNaN(value) ? DEFAULT_SETTINGS.postTitleFontSizePx : value,
                    );
                  }}
                />
              </label>

              <label className="block text-xs text-muted-fg">
                引用触发长度：{settings.copyAttributionMinLength}
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  className="mt-1 w-full"
                  value={settings.copyAttributionMinLength}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    updateSetting(
                      "copyAttributionMinLength",
                      Number.isNaN(value)
                        ? DEFAULT_SETTINGS.copyAttributionMinLength
                        : value,
                    );
                  }}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-fg">
              <input
                type="checkbox"
                checked={settings.titleAnim}
                onChange={(event) => updateSetting("titleAnim", event.target.checked)}
              />
              启用页面标题动画
            </label>

            <label className="flex items-center gap-2 text-sm text-muted-fg">
              <input
                type="checkbox"
                checked={settings.copyAttributionEnabled}
                onChange={(event) =>
                  updateSetting("copyAttributionEnabled", event.target.checked)
                }
              />
              启用复制附带引用
            </label>

            <label className="block text-xs text-muted-fg">
              评论输入占位文案
              <input
                type="text"
                value={settings.commentPlaceholder}
                onChange={(event) =>
                  updateSetting("commentPlaceholder", event.target.value)
                }
                className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <label className="block text-xs text-muted-fg">
              评论提交按钮文案
              <input
                type="text"
                value={settings.commentSubmitText}
                onChange={(event) =>
                  updateSetting("commentSubmitText", event.target.value)
                }
                className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存主题设置"}
              </button>
              <button
                type="button"
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                disabled={saving}
                className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm text-muted-fg transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                恢复代码默认值
              </button>
            </div>
          </div>
        )}

        {message ? (
          <p className="mt-3 text-sm text-green-700 dark:text-green-300">{message}</p>
        ) : null}
        {warning ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{warning}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : null}
      </section>
    </div>
  );
}
