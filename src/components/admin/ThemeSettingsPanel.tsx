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

type ThemeAssetUploadResponse = {
  success?: boolean;
  url?: string;
  error?: string;
};

type ImageFieldKey =
  | "preliminaryAvatarUrl"
  | "preliminaryNavLogoUrl"
  | "preliminarySiteIconUrl"
  | "homepageHeroBackgroundUrl1"
  | "homepageHeroBackgroundUrl2"
  | "homepageHeroBackgroundUrl3"
  | "othersLoginLogoUrl";

const DEFAULT_SETTINGS = getDefaultSakurairoPreferences();
const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml";

function normalizeUrlValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) {
    return encodeURI(trimmed);
  }
  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    return encodeURI(trimmed);
  }
}

export function ThemeSettingsPanel() {
  const [settings, setSettings] = useState<SakurairoPreferences>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageFieldKey | null>(null);
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

  const updateImageUrlSetting = (key: ImageFieldKey, rawValue: string) => {
    updateSetting(key, normalizeUrlValue(rawValue));
  };

  const uploadImageForField = async (field: ImageFieldKey, file: File) => {
    setUploadingField(field);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/theme/assets", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as ThemeAssetUploadResponse;
      if (!response.ok || !json.success || !json.url) {
        throw new Error(json.error || "图片上传失败");
      }

      updateImageUrlSetting(field, json.url);
      setMessage("图片上传成功，已自动填入 URL。");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败");
    } finally {
      setUploadingField(null);
    }
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

  const renderImageUrlField = (params: {
    label: string;
    field: ImageFieldKey;
    placeholder?: string;
  }) => {
    const { label, field, placeholder } = params;
    const isUploading = uploadingField === field;

    return (
      <label className="block text-xs text-muted-fg">
        {label}
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={settings[field]}
            placeholder={placeholder}
            onChange={(event) => updateImageUrlSetting(field, event.target.value)}
            onBlur={(event) => updateImageUrlSetting(field, event.target.value)}
            className="w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
          />
          <label className="inline-flex cursor-pointer items-center rounded-full border border-border/70 bg-surface-soft px-3 py-2 text-xs text-muted-fg transition-colors hover:text-foreground">
            {isUploading ? "上传中..." : "上传图片"}
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              disabled={isUploading || saving}
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                void uploadImageForField(field, file);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </label>
    );
  };

  return (
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          主题设置
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          可配置 Sakurairo 五大类设置：初步设置、全局设置、主页设置、页面设置、其他设置。
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
                {renderImageUrlField({
                  label: "站点头像 URL",
                  field: "preliminaryAvatarUrl",
                  placeholder: "例如：https://example.com/avatar.png",
                })}
                {renderImageUrlField({
                  label: "导航 Logo URL",
                  field: "preliminaryNavLogoUrl",
                  placeholder: "例如：https://example.com/logo.png",
                })}
                {renderImageUrlField({
                  label: "站点图标 URL（favicon）",
                  field: "preliminarySiteIconUrl",
                  placeholder: "例如：https://example.com/favicon.ico",
                })}
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
                SEO 关键词
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
                SEO 描述
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
                    <option value="default">默认</option>
                    <option value="github">GitHub 文档风格</option>
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
                    <option value="mist">薄雾</option>
                    <option value="dream">梦境</option>
                    <option value="paper">纸张</option>
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
                    <option value="normal">标准</option>
                    <option value="soft">柔和</option>
                    <option value="none">关闭</option>
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
                    <option value="auto">自动浮出</option>
                    <option value="float">始终浮层</option>
                    <option value="static">页面底部静态</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-muted-fg">
                  主文本色
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
                  强调色
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
                首页头图遮罩透明度：{settings.homepageHeroOverlayOpacity}
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
                首页信息卡透明度：{settings.homepageHeroInfoCardOpacity}
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
                首页背景自动切换间隔（秒，0 表示关闭）
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
                首页签名文案
                <input
                  type="text"
                  value={settings.homepageHeroSignature}
                  onChange={(event) =>
                    updateSetting("homepageHeroSignature", event.target.value)
                  }
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                {renderImageUrlField({
                  label: "首页背景图 URL 1",
                  field: "homepageHeroBackgroundUrl1",
                  placeholder: "可留空；例如：https://example.com/hero-1.webp",
                })}
                {renderImageUrlField({
                  label: "首页背景图 URL 2",
                  field: "homepageHeroBackgroundUrl2",
                  placeholder: "可留空；例如：https://example.com/hero-2.webp",
                })}
                {renderImageUrlField({
                  label: "首页背景图 URL 3",
                  field: "homepageHeroBackgroundUrl3",
                  placeholder: "可留空；例如：https://example.com/hero-3.webp",
                })}
              </div>
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
                    <option value="glass">玻璃态</option>
                    <option value="plain">纯色</option>
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
                      updateSetting("pageTitleDurationSec", Number.parseFloat(event.target.value))
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
                    onChange={(event) => updateSetting("pageShowPostTags", event.target.checked)}
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
                  onChange={(event) => updateSetting("commentPlaceholder", event.target.value)}
                  className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="block text-xs text-muted-fg">
                评论按钮文案
                <input
                  type="text"
                  value={settings.commentSubmitText}
                  onChange={(event) => updateSetting("commentSubmitText", event.target.value)}
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
                    <option value="default">默认</option>
                    <option value="sakurairo">樱花风格</option>
                  </select>
                </label>
                {renderImageUrlField({
                  label: "登录页 Logo URL",
                  field: "othersLoginLogoUrl",
                  placeholder: "例如：https://example.com/login-logo.png",
                })}
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
