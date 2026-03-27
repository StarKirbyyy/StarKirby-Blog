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
          全量配置 Sakurairo 五大类设置：初步设置、全局设置、主页设置、页面设置、其他设置。
        </p>
      </header>

      <section className="glass-panel mt-6 rounded-[10px] p-5 sm:p-6">
        {loading ? <p className="text-sm text-muted-fg">主题设置加载中...</p> : null}

        {!loading ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-fg">
                初步设置
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-muted-fg">
                  站点头像 URL
                  <input
                    type="text"
                    value={settings.preliminaryAvatarUrl}
                    onChange={(event) =>
                      updateSetting("preliminaryAvatarUrl", event.target.value)
                    }
                    className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="block text-xs text-muted-fg">
                  导航 Logo URL
                  <input
                    type="text"
                    value={settings.preliminaryNavLogoUrl}
                    onChange={(event) =>
                      updateSetting("preliminaryNavLogoUrl", event.target.value)
                    }
                    className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="block text-xs text-muted-fg">
                  站点 Icon URL
                  <input
                    type="text"
                    value={settings.preliminarySiteIconUrl}
                    onChange={(event) =>
                      updateSetting("preliminarySiteIconUrl", event.target.value)
                    }
                    className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex items-center gap-2 self-end text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.preliminaryWhiteCatText}
                    onChange={(event) =>
                      updateSetting("preliminaryWhiteCatText", event.target.checked)
                    }
                  />
                  启用白猫文字风格
                </label>
              </div>
              <label className="block text-xs text-muted-fg">
                SEO Keywords
                <input
                  type="text"
                  value={settings.preliminarySeoKeywords}
                  onChange={(event) =>
                    updateSetting("preliminarySeoKeywords", event.target.value)
                  }
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs text-muted-fg">
                SEO Description
                <textarea
                  rows={2}
                  value={settings.preliminarySeoDescription}
                  onChange={(event) =>
                    updateSetting("preliminarySeoDescription", event.target.value)
                  }
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-fg">
                全局设置
              </h2>
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
                  页脚模式
                  <select
                    className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                    value={settings.globalFooterMode}
                    onChange={(event) =>
                      updateSetting(
                        "globalFooterMode",
                        event.target.value as SakurairoPreferences["globalFooterMode"],
                      )
                    }
                  >
                    <option value="auto">Auto</option>
                    <option value="float">Float</option>
                    <option value="static">Static</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-muted-fg">
                  主文本色（Theme Skin）
                  <input
                    type="color"
                    value={settings.globalThemeSkin}
                    onChange={(event) =>
                      updateSetting("globalThemeSkin", event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-[10px] border border-border/70 bg-background p-1"
                  />
                </label>
                <label className="block text-xs text-muted-fg">
                  强调色（Theme Skin Matching）
                  <input
                    type="color"
                    value={settings.globalThemeSkinMatching}
                    onChange={(event) =>
                      updateSetting("globalThemeSkinMatching", event.target.value)
                    }
                    className="mt-1 h-10 w-full rounded-[10px] border border-border/70 bg-background p-1"
                  />
                </label>
              </div>
              <label className="block text-xs text-muted-fg">
                全局字重：{settings.globalFontWeight}
                <input
                  type="range"
                  min={200}
                  max={500}
                  step={10}
                  className="mt-1 w-full"
                  value={settings.globalFontWeight}
                  onChange={(event) =>
                    updateSetting("globalFontWeight", Number.parseInt(event.target.value, 10))
                  }
                />
              </label>
              <label className="block text-xs text-muted-fg">
                菜单圆角：{settings.globalMenuRadiusPx}px
                <input
                  type="range"
                  min={6}
                  max={24}
                  step={1}
                  className="mt-1 w-full"
                  value={settings.globalMenuRadiusPx}
                  onChange={(event) =>
                    updateSetting("globalMenuRadiusPx", Number.parseInt(event.target.value, 10))
                  }
                />
              </label>
              <label className="block text-xs text-muted-fg">
                组件透明度：{settings.globalWidgetTransparency}
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.05}
                  className="mt-1 w-full"
                  value={settings.globalWidgetTransparency}
                  onChange={(event) =>
                    updateSetting(
                      "globalWidgetTransparency",
                      Number.parseFloat(event.target.value),
                    )
                  }
                />
              </label>
              <label className="block text-xs text-muted-fg">
                前景透明度：{settings.globalFrontTransparency}
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.05}
                  className="mt-1 w-full"
                  value={settings.globalFrontTransparency}
                  onChange={(event) =>
                    updateSetting(
                      "globalFrontTransparency",
                      Number.parseFloat(event.target.value),
                    )
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-fg">
                <input
                  type="checkbox"
                  checked={settings.globalShowUtilityButtons}
                  onChange={(event) =>
                    updateSetting("globalShowUtilityButtons", event.target.checked)
                  }
                />
                显示右侧工具按钮
              </label>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-fg">
                主页设置
              </h2>
              <label className="block text-xs text-muted-fg">
                Hero 遮罩透明度：{settings.homepageHeroOverlayOpacity}
                <input
                  type="range"
                  min={0}
                  max={0.9}
                  step={0.02}
                  className="mt-1 w-full"
                  value={settings.homepageHeroOverlayOpacity}
                  onChange={(event) =>
                    updateSetting(
                      "homepageHeroOverlayOpacity",
                      Number.parseFloat(event.target.value),
                    )
                  }
                />
              </label>
              <label className="block text-xs text-muted-fg">
                Hero 信息卡透明度：{settings.homepageHeroInfoCardOpacity}
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.02}
                  className="mt-1 w-full"
                  value={settings.homepageHeroInfoCardOpacity}
                  onChange={(event) =>
                    updateSetting(
                      "homepageHeroInfoCardOpacity",
                      Number.parseFloat(event.target.value),
                    )
                  }
                />
              </label>
              <label className="block text-xs text-muted-fg">
                Hero 自动切换背景间隔（秒，0 关闭）
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={settings.homepageHeroAutoBackgroundSec}
                  onChange={(event) =>
                    updateSetting(
                      "homepageHeroAutoBackgroundSec",
                      Number.parseInt(event.target.value, 10) || 0,
                    )
                  }
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs text-muted-fg">
                Hero 签名文案
                <input
                  type="text"
                  value={settings.homepageHeroSignature}
                  onChange={(event) =>
                    updateSetting("homepageHeroSignature", event.target.value)
                  }
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.homepageHeroTypingEffect}
                    onChange={(event) =>
                      updateSetting("homepageHeroTypingEffect", event.target.checked)
                    }
                  />
                  启用打字机效果
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.homepageHeroShowSocial}
                    onChange={(event) =>
                      updateSetting("homepageHeroShowSocial", event.target.checked)
                    }
                  />
                  显示社交入口
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.homepageHeroShowStats}
                    onChange={(event) =>
                      updateSetting("homepageHeroShowStats", event.target.checked)
                    }
                  />
                  显示统计信息
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.homepageHeroShowScrollHint}
                    onChange={(event) =>
                      updateSetting("homepageHeroShowScrollHint", event.target.checked)
                    }
                  />
                  显示向下提示
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-fg">
                页面设置
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
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
                  标题动画时长：{settings.pageTitleDurationSec}s
                  <input
                    type="range"
                    min={0.3}
                    max={5}
                    step={0.1}
                    className="mt-1 w-full"
                    value={settings.pageTitleDurationSec}
                    onChange={(event) =>
                      updateSetting(
                        "pageTitleDurationSec",
                        Number.parseFloat(event.target.value),
                      )
                    }
                  />
                </label>
              </div>
              <label className="block text-xs text-muted-fg">
                文章标题字号：{settings.postTitleFontSizePx}px
                <input
                  type="range"
                  min={24}
                  max={44}
                  step={1}
                  className="mt-1 w-full"
                  value={settings.postTitleFontSizePx}
                  onChange={(event) =>
                    updateSetting("postTitleFontSizePx", Number.parseInt(event.target.value, 10))
                  }
                />
              </label>
              <label className="block text-xs text-muted-fg">
                复制引用触发长度：{settings.copyAttributionMinLength}
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  className="mt-1 w-full"
                  value={settings.copyAttributionMinLength}
                  onChange={(event) =>
                    updateSetting(
                      "copyAttributionMinLength",
                      Number.parseInt(event.target.value, 10),
                    )
                  }
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.titleAnim}
                    onChange={(event) => updateSetting("titleAnim", event.target.checked)}
                  />
                  启用标题动画
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.pagePostTitleUnderline}
                    onChange={(event) =>
                      updateSetting("pagePostTitleUnderline", event.target.checked)
                    }
                  />
                  启用标题下划线
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.pageShowToc}
                    onChange={(event) => updateSetting("pageShowToc", event.target.checked)}
                  />
                  显示目录
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.pageShowPostTags}
                    onChange={(event) =>
                      updateSetting("pageShowPostTags", event.target.checked)
                    }
                  />
                  显示文章标签
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.pageShowPostNavigation}
                    onChange={(event) =>
                      updateSetting("pageShowPostNavigation", event.target.checked)
                    }
                  />
                  显示上下篇导航
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-fg">
                  <input
                    type="checkbox"
                    checked={settings.copyAttributionEnabled}
                    onChange={(event) =>
                      updateSetting("copyAttributionEnabled", event.target.checked)
                    }
                  />
                  复制附带引用
                </label>
              </div>
              <label className="block text-xs text-muted-fg">
                评论占位文案
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
                评论按钮文案
                <input
                  type="text"
                  value={settings.commentSubmitText}
                  onChange={(event) =>
                    updateSetting("commentSubmitText", event.target.value)
                  }
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-fg">
                其他设置
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-muted-fg">
                  登录页风格
                  <select
                    className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                    value={settings.othersLoginStyle}
                    onChange={(event) =>
                      updateSetting(
                        "othersLoginStyle",
                        event.target.value as SakurairoPreferences["othersLoginStyle"],
                      )
                    }
                  >
                    <option value="default">Default</option>
                    <option value="sakurairo">Sakurairo</option>
                  </select>
                </label>
                <label className="block text-xs text-muted-fg">
                  登录页 Logo URL
                  <input
                    type="text"
                    value={settings.othersLoginLogoUrl}
                    onChange={(event) =>
                      updateSetting("othersLoginLogoUrl", event.target.value)
                    }
                    className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-fg">
                <input
                  type="checkbox"
                  checked={settings.othersLoginRedirectToAdmin}
                  onChange={(event) =>
                    updateSetting("othersLoginRedirectToAdmin", event.target.checked)
                  }
                />
                登录后优先跳转后台
              </label>
            </section>

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
        ) : null}

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
