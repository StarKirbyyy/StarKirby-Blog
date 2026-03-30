export const siteConfig = {
  // 站点基础信息
  name: "StarKirby Blog",
  title: "StarKirby Blog",
  description: "StarKirby 的个人技术博客，分享编程、学习笔记与项目记录。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://starkirby.top",
  ogImage: "/opengraph-image",
  locale: "zh-CN",

  // 作者信息
  author: {
    name: "StarKirby",
    avatar: "",
    bio: "热爱编程与开源的开发者。",
    skills: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Tailwind CSS",
      "MDX",
    ],
    social: {
      github: "https://github.com/StarKirbyyy",
      twitter: "", // 填入 Twitter/X 链接
      email: "mailto:hello@starkirby.dev",
    },
  },

  // 导航菜单
  nav: [
    { title: "首页", href: "/" },
    { title: "文章", href: "/posts" },
    { title: "标签", href: "/tags" },
    { title: "关于", href: "/about" },
    { title: "项目", href: "/projects" },
  ],

  // 文章列表配置
  postsPerPage: 10,
  latestPostsCount: 5, // 首页展示的最新文章数

  // 社交链接（Footer & About 页公用）
  socialLinks: [
    {
      label: "GitHub",
      href: "https://github.com/StarKirbyyy",
      icon: "github",
    },
    // 按需添加 Twitter、Email 等
  ],

  projects: [
    {
      name: "StarKirby Blog",
      description:
        "基于 Next.js 16 与 MDX 的个人技术博客，支持标签系统、SEO 自动化与文章静态生成。",
      techStack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "MDX"],
      github: "https://github.com/StarKirbyyy/starkirby-blog",
      demo: "/",
    },
  ],

  comments: {
    provider:
      process.env.NEXT_PUBLIC_COMMENT_PROVIDER === "local" ? "local" : "giscus",
    giscus: {
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? "",
      repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? "",
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? "",
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? "",
      mapping: "pathname",
      strict: "0",
      reactionsEnabled: "1",
      inputPosition: "top",
      lang: "zh-CN",
      theme: "preferred_color_scheme",
    },
  },

  sakurairo: {
    // 初步设置
    preliminaryAvatarUrl: "",
    preliminaryWhiteCatText: false,
    preliminaryNavLogoUrl: "",
    preliminarySiteIconUrl: "",
    preliminarySeoKeywords: "",
    preliminarySeoDescription: "",

    // 全局设置
    globalThemeSkin: "#000000",
    globalThemeSkinMatching: "#a4cdf6",
    globalBackgroundImageUrl: "",
    globalFontWeight: 400,
    globalMenuRadiusPx: 10,
    globalWidgetTransparency: 0.7,
    globalFrontTransparency: 0.7,
    globalFooterMode: "auto" as "auto" | "float" | "static",
    globalShowUtilityButtons: true,

    // 主页设置
    homepageHeroOverlayOpacity: 0.56,
    homepageHeroInfoCardOpacity: 0.18,
    homepageHeroTypingEffect: true,
    homepageHeroAutoBackgroundSec: 0,
    homepageHeroShowSocial: true,
    homepageHeroShowStats: true,
    homepageHeroShowScrollHint: true,
    homepageHeroSignature: "愿我们都能写下值得回看的代码与故事。",
    homepageHeroBackgroundUrl1: "",
    homepageHeroBackgroundUrl2: "",
    homepageHeroBackgroundUrl3: "",

    // 页面设置
    pageLayoutStyle: "default" as "default" | "github",
    pageTitleAnimation: true,
    pageTitleAnimationDuration: 1.2,
    pageShowToc: true,
    pageShowPostTags: true,
    pageShowPostNavigation: true,
    postTitleUnderlineAnimation: true,
    addAttributionOnCopy: true,
    copyAttributionMinLength: 30,
    postTitleFontSizePx: 34,
    commentPlaceholder: "写下你的评论（支持基本 Markdown，最多 1000 字）",
    commentSubmitText: "发送评论",

    // 其他设置
    othersLoginStyle: "default" as "default" | "sakurairo",
    othersLoginLogoUrl: "",
    othersLoginRedirectToAdmin: false,
  },

  // RSS
  rss: {
    title: "StarKirby Blog",
    description: "StarKirby 的个人技术博客",
  },
} as const;

export type SiteConfig = typeof siteConfig;
