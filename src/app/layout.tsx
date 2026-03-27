import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "katex/dist/katex.min.css";
import { siteConfig } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { UtilityButtons } from "@/components/layout/UtilityButtons";
import { CopyAttribution } from "@/components/layout/CopyAttribution";

// Geist Mono 仅加载 latin 子集，控制字体体积
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [{ url: siteConfig.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 防止主题切换时页面闪白（在 JS 加载前读取 localStorage）
const themeScript = `
(function() {
  try {
    var defaults = {
      preliminaryAvatarUrl: ${JSON.stringify(siteConfig.sakurairo.preliminaryAvatarUrl)},
      preliminaryWhiteCatText: ${siteConfig.sakurairo.preliminaryWhiteCatText ? "true" : "false"},
      preliminaryNavLogoUrl: ${JSON.stringify(siteConfig.sakurairo.preliminaryNavLogoUrl)},
      preliminarySiteIconUrl: ${JSON.stringify(siteConfig.sakurairo.preliminarySiteIconUrl)},
      preliminarySeoKeywords: ${JSON.stringify(siteConfig.sakurairo.preliminarySeoKeywords)},
      preliminarySeoDescription: ${JSON.stringify(siteConfig.sakurairo.preliminarySeoDescription)},
      layoutMode: ${JSON.stringify(siteConfig.sakurairo.pageLayoutStyle)},
      bgStyle: "mist",
      motion: "normal",
      globalThemeSkin: ${JSON.stringify(siteConfig.sakurairo.globalThemeSkin)},
      globalThemeSkinMatching: ${JSON.stringify(siteConfig.sakurairo.globalThemeSkinMatching)},
      globalFontWeight: ${siteConfig.sakurairo.globalFontWeight},
      globalMenuRadiusPx: ${siteConfig.sakurairo.globalMenuRadiusPx},
      globalWidgetTransparency: ${siteConfig.sakurairo.globalWidgetTransparency},
      globalFrontTransparency: ${siteConfig.sakurairo.globalFrontTransparency},
      globalFooterMode: ${JSON.stringify(siteConfig.sakurairo.globalFooterMode)},
      globalShowUtilityButtons: ${siteConfig.sakurairo.globalShowUtilityButtons ? "true" : "false"},
      homepageHeroOverlayOpacity: ${siteConfig.sakurairo.homepageHeroOverlayOpacity},
      homepageHeroInfoCardOpacity: ${siteConfig.sakurairo.homepageHeroInfoCardOpacity},
      homepageHeroTypingEffect: ${siteConfig.sakurairo.homepageHeroTypingEffect ? "true" : "false"},
      homepageHeroAutoBackgroundSec: ${siteConfig.sakurairo.homepageHeroAutoBackgroundSec},
      homepageHeroShowSocial: ${siteConfig.sakurairo.homepageHeroShowSocial ? "true" : "false"},
      homepageHeroShowStats: ${siteConfig.sakurairo.homepageHeroShowStats ? "true" : "false"},
      homepageHeroShowScrollHint: ${siteConfig.sakurairo.homepageHeroShowScrollHint ? "true" : "false"},
      homepageHeroSignature: ${JSON.stringify(siteConfig.sakurairo.homepageHeroSignature)},
      homepageHeroBackgroundUrl1: ${JSON.stringify(siteConfig.sakurairo.homepageHeroBackgroundUrl1)},
      homepageHeroBackgroundUrl2: ${JSON.stringify(siteConfig.sakurairo.homepageHeroBackgroundUrl2)},
      homepageHeroBackgroundUrl3: ${JSON.stringify(siteConfig.sakurairo.homepageHeroBackgroundUrl3)},
      titleAnim: ${siteConfig.sakurairo.pageTitleAnimation ? "true" : "false"},
      pageTitleDurationSec: ${siteConfig.sakurairo.pageTitleAnimationDuration},
      commentStyle: "glass",
      postTitleFontSizePx: ${siteConfig.sakurairo.postTitleFontSizePx},
      pagePostTitleUnderline: ${siteConfig.sakurairo.postTitleUnderlineAnimation ? "true" : "false"},
      pageShowToc: ${siteConfig.sakurairo.pageShowToc ? "true" : "false"},
      pageShowPostTags: ${siteConfig.sakurairo.pageShowPostTags ? "true" : "false"},
      pageShowPostNavigation: ${siteConfig.sakurairo.pageShowPostNavigation ? "true" : "false"},
      copyAttributionEnabled: ${siteConfig.sakurairo.addAttributionOnCopy ? "true" : "false"},
      copyAttributionMinLength: ${siteConfig.sakurairo.copyAttributionMinLength},
      commentPlaceholder: ${JSON.stringify(siteConfig.sakurairo.commentPlaceholder)},
      commentSubmitText: ${JSON.stringify(siteConfig.sakurairo.commentSubmitText)},
      othersLoginStyle: ${JSON.stringify(siteConfig.sakurairo.othersLoginStyle)},
      othersLoginLogoUrl: ${JSON.stringify(siteConfig.sakurairo.othersLoginLogoUrl)},
      othersLoginRedirectToAdmin: ${siteConfig.sakurairo.othersLoginRedirectToAdmin ? "true" : "false"}
    };

    function getString(key, fallback) {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    }
    function getNumber(key, fallback) {
      var value = localStorage.getItem(key);
      if (value === null || value === "") return fallback;
      var parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    function getBoolean(key, fallback) {
      var value = localStorage.getItem(key);
      if (value === null) return fallback;
      return value === "true";
    }

    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    var settings = {
      preliminaryAvatarUrl: getString("sakurairo:preliminary-avatar-url", defaults.preliminaryAvatarUrl),
      preliminaryWhiteCatText: getBoolean("sakurairo:preliminary-white-cat-text", defaults.preliminaryWhiteCatText),
      preliminaryNavLogoUrl: getString("sakurairo:preliminary-nav-logo-url", defaults.preliminaryNavLogoUrl),
      preliminarySiteIconUrl: getString("sakurairo:preliminary-site-icon-url", defaults.preliminarySiteIconUrl),
      preliminarySeoKeywords: getString("sakurairo:preliminary-seo-keywords", defaults.preliminarySeoKeywords),
      preliminarySeoDescription: getString("sakurairo:preliminary-seo-description", defaults.preliminarySeoDescription),
      layoutMode: getString("sakurairo:layout-mode", defaults.layoutMode),
      bgStyle: getString("sakurairo:bg-style", defaults.bgStyle),
      motion: getString("sakurairo:motion", defaults.motion),
      globalThemeSkin: getString("sakurairo:global-theme-skin", defaults.globalThemeSkin),
      globalThemeSkinMatching: getString("sakurairo:global-theme-skin-matching", defaults.globalThemeSkinMatching),
      globalFontWeight: getNumber("sakurairo:global-font-weight", defaults.globalFontWeight),
      globalMenuRadiusPx: getNumber("sakurairo:global-menu-radius", defaults.globalMenuRadiusPx),
      globalWidgetTransparency: getNumber("sakurairo:global-widget-transparency", defaults.globalWidgetTransparency),
      globalFrontTransparency: getNumber("sakurairo:global-front-transparency", defaults.globalFrontTransparency),
      globalFooterMode: getString("sakurairo:global-footer-mode", defaults.globalFooterMode),
      globalShowUtilityButtons: getBoolean("sakurairo:global-show-utility-buttons", defaults.globalShowUtilityButtons),
      homepageHeroOverlayOpacity: getNumber("sakurairo:homepage-hero-overlay-opacity", defaults.homepageHeroOverlayOpacity),
      homepageHeroInfoCardOpacity: getNumber("sakurairo:homepage-hero-info-card-opacity", defaults.homepageHeroInfoCardOpacity),
      homepageHeroTypingEffect: getBoolean("sakurairo:homepage-hero-typing-effect", defaults.homepageHeroTypingEffect),
      homepageHeroAutoBackgroundSec: getNumber("sakurairo:homepage-hero-auto-bg-sec", defaults.homepageHeroAutoBackgroundSec),
      homepageHeroShowSocial: getBoolean("sakurairo:homepage-hero-show-social", defaults.homepageHeroShowSocial),
      homepageHeroShowStats: getBoolean("sakurairo:homepage-hero-show-stats", defaults.homepageHeroShowStats),
      homepageHeroShowScrollHint: getBoolean("sakurairo:homepage-hero-show-scroll-hint", defaults.homepageHeroShowScrollHint),
      homepageHeroSignature: getString("sakurairo:homepage-hero-signature", defaults.homepageHeroSignature),
      homepageHeroBackgroundUrl1: getString("sakurairo:homepage-hero-bg-url-1", defaults.homepageHeroBackgroundUrl1),
      homepageHeroBackgroundUrl2: getString("sakurairo:homepage-hero-bg-url-2", defaults.homepageHeroBackgroundUrl2),
      homepageHeroBackgroundUrl3: getString("sakurairo:homepage-hero-bg-url-3", defaults.homepageHeroBackgroundUrl3),
      titleAnim: getBoolean("sakurairo:title-anim", defaults.titleAnim),
      pageTitleDurationSec: getNumber("sakurairo:page-title-duration-sec", defaults.pageTitleDurationSec),
      commentStyle: getString("sakurairo:comment-style", defaults.commentStyle),
      postTitleFontSizePx: getNumber("sakurairo:post-title-size", defaults.postTitleFontSizePx),
      pagePostTitleUnderline: getBoolean("sakurairo:page-post-title-underline", defaults.pagePostTitleUnderline),
      pageShowToc: getBoolean("sakurairo:page-show-toc", defaults.pageShowToc),
      pageShowPostTags: getBoolean("sakurairo:page-show-post-tags", defaults.pageShowPostTags),
      pageShowPostNavigation: getBoolean("sakurairo:page-show-post-navigation", defaults.pageShowPostNavigation),
      copyAttributionEnabled: getBoolean("sakurairo:copy-attribution-enabled", defaults.copyAttributionEnabled),
      copyAttributionMinLength: getNumber("sakurairo:copy-attribution-min-length", defaults.copyAttributionMinLength),
      commentPlaceholder: getString("sakurairo:comment-placeholder", defaults.commentPlaceholder),
      commentSubmitText: getString("sakurairo:comment-submit-text", defaults.commentSubmitText),
      othersLoginStyle: getString("sakurairo:others-login-style", defaults.othersLoginStyle),
      othersLoginLogoUrl: getString("sakurairo:others-login-logo-url", defaults.othersLoginLogoUrl),
      othersLoginRedirectToAdmin: getBoolean("sakurairo:others-login-redirect-to-admin", defaults.othersLoginRedirectToAdmin)
    };

    document.documentElement.classList.toggle('layout-github', settings.layoutMode === 'github');
    document.documentElement.classList.remove('motion-normal', 'motion-soft', 'motion-none');
    document.documentElement.classList.add('motion-' + settings.motion);
    document.documentElement.classList.remove('comment-glass', 'comment-plain');
    document.documentElement.classList.add('comment-' + settings.commentStyle);
    document.documentElement.classList.toggle('title-anim-off', !settings.titleAnim);
    document.documentElement.classList.toggle('sakurairo-white-cat-text', !!settings.preliminaryWhiteCatText);

    document.documentElement.dataset.bgStyle = settings.bgStyle;
    document.documentElement.dataset.footerMode = settings.globalFooterMode;
    document.documentElement.dataset.globalShowUtilityButtons = String(settings.globalShowUtilityButtons);

    document.documentElement.dataset.preliminaryAvatarUrl = settings.preliminaryAvatarUrl;
    document.documentElement.dataset.preliminaryWhiteCatText = String(settings.preliminaryWhiteCatText);
    document.documentElement.dataset.preliminaryNavLogoUrl = settings.preliminaryNavLogoUrl;
    document.documentElement.dataset.preliminarySiteIconUrl = settings.preliminarySiteIconUrl;
    document.documentElement.dataset.preliminarySeoKeywords = settings.preliminarySeoKeywords;
    document.documentElement.dataset.preliminarySeoDescription = settings.preliminarySeoDescription;

    document.documentElement.dataset.homepageHeroTypingEffect = String(settings.homepageHeroTypingEffect);
    document.documentElement.dataset.homepageHeroAutoBackgroundSec = String(settings.homepageHeroAutoBackgroundSec);
    document.documentElement.dataset.homepageHeroShowSocial = String(settings.homepageHeroShowSocial);
    document.documentElement.dataset.homepageHeroShowStats = String(settings.homepageHeroShowStats);
    document.documentElement.dataset.homepageHeroShowScrollHint = String(settings.homepageHeroShowScrollHint);
    document.documentElement.dataset.homepageHeroSignature = settings.homepageHeroSignature;
    document.documentElement.dataset.homepageHeroBackgroundUrl1 = settings.homepageHeroBackgroundUrl1;
    document.documentElement.dataset.homepageHeroBackgroundUrl2 = settings.homepageHeroBackgroundUrl2;
    document.documentElement.dataset.homepageHeroBackgroundUrl3 = settings.homepageHeroBackgroundUrl3;

    document.documentElement.dataset.pagePostTitleUnderline = String(settings.pagePostTitleUnderline);
    document.documentElement.dataset.pageShowToc = String(settings.pageShowToc);
    document.documentElement.dataset.pageShowPostTags = String(settings.pageShowPostTags);
    document.documentElement.dataset.pageShowPostNavigation = String(settings.pageShowPostNavigation);

    document.documentElement.dataset.copyAttributionEnabled = String(settings.copyAttributionEnabled);
    document.documentElement.dataset.copyAttributionMinLength = String(settings.copyAttributionMinLength);
    document.documentElement.dataset.commentPlaceholder = settings.commentPlaceholder;
    document.documentElement.dataset.commentSubmitText = settings.commentSubmitText;

    document.documentElement.dataset.othersLoginStyle = settings.othersLoginStyle;
    document.documentElement.dataset.othersLoginLogoUrl = settings.othersLoginLogoUrl;
    document.documentElement.dataset.othersLoginRedirectToAdmin = String(settings.othersLoginRedirectToAdmin);

    document.documentElement.style.setProperty('--theme-skin', settings.globalThemeSkin);
    document.documentElement.style.setProperty('--theme-skin-matching', settings.globalThemeSkinMatching);
    document.documentElement.style.setProperty('--global-font-weight', String(settings.globalFontWeight));
    document.documentElement.style.setProperty('--style_menu_radius', settings.globalMenuRadiusPx + 'px');
    document.documentElement.style.setProperty('--homepage_widget_transparency', String(settings.globalWidgetTransparency));
    document.documentElement.style.setProperty('--front_background-transparency', String(settings.globalFrontTransparency));
    document.documentElement.style.setProperty('--sakurairo-post-title-size', settings.postTitleFontSizePx + 'px');
    document.documentElement.style.setProperty('--sakurairo-title-duration', settings.pageTitleDurationSec + 's');
    document.documentElement.style.setProperty('--sakurairo-hero-overlay-opacity', String(settings.homepageHeroOverlayOpacity));
    document.documentElement.style.setProperty('--sakurairo-hero-info-opacity', String(settings.homepageHeroInfoCardOpacity));

    if (settings.preliminarySiteIconUrl) {
      var icon = document.querySelector("link[rel='icon']") || document.createElement('link');
      icon.setAttribute('rel', 'icon');
      icon.setAttribute('href', settings.preliminarySiteIconUrl);
      if (!icon.parentNode) document.head.appendChild(icon);
    }
    if (settings.preliminarySeoKeywords) {
      var keywordMeta = document.querySelector("meta[name='keywords']") || document.createElement('meta');
      keywordMeta.setAttribute('name', 'keywords');
      keywordMeta.setAttribute('content', settings.preliminarySeoKeywords);
      if (!keywordMeta.parentNode) document.head.appendChild(keywordMeta);
    }
    if (settings.preliminarySeoDescription) {
      var descMeta = document.querySelector("meta[name='description']");
      if (descMeta) {
        descMeta.setAttribute('content', settings.preliminarySeoDescription);
      }
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={geistMono.variable}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Noto+Serif+SC|Noto+Sans+SC|Fira+Code&display=swap"
        />
        {/* 主题初始化：在页面渲染前读取用户主题偏好，避免闪白 */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className="site-shell min-h-full bg-background text-foreground">
        <GlobalBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 pb-36 pt-[4.5rem] sm:pb-40 sm:pt-24">
            {children}
          </main>
          <UtilityButtons />
          <CopyAttribution />
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
