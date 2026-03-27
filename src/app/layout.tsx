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
import { SakurairoCustomizer } from "@/components/layout/SakurairoCustomizer";

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
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    var layoutMode = localStorage.getItem('sakurairo:layout-mode');
    var bgStyle = localStorage.getItem('sakurairo:bg-style');
    var motion = localStorage.getItem('sakurairo:motion');
    var titleAnim = localStorage.getItem('sakurairo:title-anim');
    var commentStyle = localStorage.getItem('sakurairo:comment-style');
    var postTitleSize = localStorage.getItem('sakurairo:post-title-size');
    var copyAttributionEnabled = localStorage.getItem('sakurairo:copy-attribution-enabled');
    var copyAttributionMinLength = localStorage.getItem('sakurairo:copy-attribution-min-length');
    var commentPlaceholder = localStorage.getItem('sakurairo:comment-placeholder');
    var commentSubmitText = localStorage.getItem('sakurairo:comment-submit-text');

    if (!layoutMode) layoutMode = '${siteConfig.sakurairo.pageLayoutStyle}';
    if (!bgStyle) bgStyle = 'mist';
    if (!motion) motion = 'normal';
    if (!commentStyle) commentStyle = 'glass';
    if (!postTitleSize) postTitleSize = '${siteConfig.sakurairo.postTitleFontSizePx}';
    if (copyAttributionEnabled === null) copyAttributionEnabled = '${String(siteConfig.sakurairo.addAttributionOnCopy)}';
    if (!copyAttributionMinLength) copyAttributionMinLength = '${siteConfig.sakurairo.copyAttributionMinLength}';
    if (!commentPlaceholder) commentPlaceholder = ${JSON.stringify(siteConfig.sakurairo.commentPlaceholder)};
    if (!commentSubmitText) commentSubmitText = ${JSON.stringify(siteConfig.sakurairo.commentSubmitText)};

    document.documentElement.classList.toggle('layout-github', layoutMode === 'github');
    document.documentElement.classList.remove('motion-normal', 'motion-soft', 'motion-none');
    document.documentElement.classList.add('motion-' + motion);
    document.documentElement.classList.remove('comment-glass', 'comment-plain');
    document.documentElement.classList.add('comment-' + commentStyle);
    document.documentElement.dataset.bgStyle = bgStyle;
    document.documentElement.style.setProperty('--sakurairo-post-title-size', postTitleSize + 'px');
    document.documentElement.dataset.copyAttributionEnabled = copyAttributionEnabled;
    document.documentElement.dataset.copyAttributionMinLength = copyAttributionMinLength;
    document.documentElement.dataset.commentPlaceholder = commentPlaceholder;
    document.documentElement.dataset.commentSubmitText = commentSubmitText;

    var defaultTitleAnim = ${siteConfig.sakurairo.pageTitleAnimation ? "true" : "false"};
    var titleAnimEnabled = titleAnim === null ? defaultTitleAnim : titleAnim === 'true';
    document.documentElement.classList.toggle('title-anim-off', !titleAnimEnabled);
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
          <SakurairoCustomizer />
          <CopyAttribution />
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
