export const siteConfig = {
  // 站点基础信息
  name: "StarKirby Blog",
  title: "StarKirby Blog",
  description: "StarKirby 的个人技术博客，分享编程、学习笔记与项目记录。",
  url: "https://blog.starkirby.dev",
  ogImage: "/og-default.png",
  locale: "zh-CN",

  // 作者信息
  author: {
    name: "StarKirby",
    avatar: "/images/avatar.jpg",
    bio: "热爱编程与开源的开发者。",
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

  // RSS
  rss: {
    title: "StarKirby Blog",
    description: "StarKirby 的个人技术博客",
  },
} as const;

export type SiteConfig = typeof siteConfig;
