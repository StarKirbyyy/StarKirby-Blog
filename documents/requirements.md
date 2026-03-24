# StarKirby Blog — 详细需求文档

> 版本：v0.1（草稿）  
> 日期：2026-03-24  
> 项目仓库：`starkirby-blog`（Next.js 16 / React 19 / Tailwind CSS 4 / TypeScript）

---

## 一、项目概览

StarKirby Blog 是一个**面向个人开发者**的技术博客网站，用于发布技术文章、学习笔记、项目记录等内容。博客同时承担**个人品牌展示**职能，需兼顾内容阅读体验与视觉美观。

### 目标受众
- 技术社区读者（GitHub / 掘金 / 知乎等渠道导流）
- 潜在合作者或招聘方

### 核心目标
1. **内容优先**：让读者专注于文章内容，排版舒适、层次清晰
2. **轻松维护**：博主可通过 Markdown/MDX 文件撰写并发布文章，无需数据库
3. **高性能**：首屏快速加载，SEO 友好，利于搜索引擎收录
4. **视觉美观**：现代简约风格，支持亮/暗双主题

---

## 二、技术栈

| 层次 | 技术 | 说明 |
|---|---|---|
| 框架 | Next.js 16（App Router） | SSG/ISR 渲染文章页 |
| UI 语言 | TypeScript + React 19 | 强类型，React Compiler 启用 |
| 样式 | Tailwind CSS 4 | Utility-first，PostCSS 构建 |
| 内容 | MDX（待引入） | 文章以 `.mdx` 文件存储在 `content/` 目录 |
| 代码高亮 | Shiki 或 rehype-pretty-code（待选型） | 支持多语言语法高亮 |
| 包管理 | pnpm + pnpm workspace | monorepo 预留扩展 |
| 部署 | Vercel（首选）或静态导出 | SSG 优先，零成本托管 |

---

## 三、页面与路由结构

```
/                        → 首页（文章列表 + 个人简介）
/posts                   → 文章列表页（分页）
/posts/[slug]            → 文章详情页
/tags                    → 标签云总览页
/tags/[tag]              → 指定标签下的文章列表
/about                   → 关于页（作者简介 + 链接）
/projects                → 项目展示页（可选）
/rss.xml                 → RSS Feed（自动生成）
/sitemap.xml             → Sitemap（自动生成）
```

---

## 四、内容管理

### 4.1 文章数据源
- 所有文章以 `.mdx` 格式存储于 `content/posts/` 目录下
- 每篇文章包含 **frontmatter**（YAML 头信息）

#### Frontmatter 字段规范

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | `string` | ✅ | 文章标题 |
| `description` | `string` | ✅ | 摘要，用于 SEO meta description |
| `date` | `YYYY-MM-DD` | ✅ | 发布日期 |
| `updated` | `YYYY-MM-DD` | ❌ | 最后更新日期 |
| `tags` | `string[]` | ❌ | 标签列表 |
| `cover` | `string` | ❌ | 封面图路径（相对或绝对 URL） |
| `draft` | `boolean` | ❌ | `true` 时不在生产环境列出 |
| `slug` | `string` | ❌ | 自定义 URL slug，默认取文件名 |
| `readingTime` | 自动计算 | — | 阅读时长（自动，无需手填） |

### 4.2 文章内容规范
- 支持标准 Markdown 语法
- 支持 MDX（在 Markdown 中嵌入 React 组件）
- 支持以下扩展语法：
  - GFM（表格、任务列表、删除线）
  - 代码块语法高亮（支持行高亮、文件名显示）
  - 数学公式（KaTeX，可选）
  - 图片优化（通过 `next/image` 包装）
  - 脚注（Footnotes）

### 4.3 静态资源
- 文章内图片存放于 `public/images/posts/[slug]/` 下
- 封面图存放于 `public/images/covers/` 下

---

## 五、功能模块细化

### 5.1 首页（`/`）

#### 区块一：Hero / 个人简介
- 展示博主头像（圆形，支持优化加载）
- 博主名称（大号醒目字体）
- 一句话简介（副标题）
- 社交链接图标组（GitHub、Twitter/X、邮件等，可配置）
- 可选：打字机动效展示博主身份关键词

#### 区块二：最新文章列表
- 展示最近 N 篇文章（默认 5 篇，可配置）
- 每篇文章卡片包含：
  - 标题（链接至详情页）
  - 发布日期
  - 标签（可点击跳转标签页）
  - 摘要（description 字段，截断展示）
  - 阅读时长（自动计算）
- 「查看全部文章」按钮链接至 `/posts`

#### 区块三：精选项目（可选）
- 展示 2~3 个代表性项目卡片
- 每张卡片：项目名、简短描述、技术栈标签、GitHub 链接

---

### 5.2 文章列表页（`/posts`）

- 展示全部已发布文章（按日期倒序）
- 支持**分页**（每页显示数量可配置，推荐 10 篇）
  - 可选：无限滚动 vs. 传统分页按钮（**需博主确认**）
- 支持**按标签筛选**（顶部标签 chip 切换）
- 列表项布局：
  - 卡片式（card grid）或列表式（list），**需博主确认偏好**
  - 包含：标题、日期、标签、摘要、阅读时长、封面图（若有）

---

### 5.3 文章详情页（`/posts/[slug]`）

#### 正文区域
- 文章标题（`<h1>`）
- 元信息行：发布日期 / 最后更新日期 / 阅读时长 / 标签
- 封面图（若存在，置于标题下方）
- MDX 渲染正文
  - 自定义排版样式（`@tailwindcss/typography` prose 类）
  - 代码块：语言标识 + 行高亮 + 复制按钮 + 文件名
  - 图片：自动 `next/image` 优化 + 点击 lightbox 放大（可选）
  - 外链：新标签页打开 + `rel="noopener noreferrer"`

#### 导航区域
- **目录（TOC）**：锚点导航，跟随滚动高亮当前章节
  - PC 端：右侧 sticky 浮动
  - 移动端：顶部折叠抽屉 or 隐藏
- **文章导航**：底部展示上一篇 / 下一篇
- **返回列表**：顶部面包屑导航

#### 互动区域（可选，后期迭代）
- 评论系统（Giscus / Utterances，基于 GitHub Discussions）
- 点赞 / 阅读计数（需外部服务，如 Vercel KV 或简易 API）

#### 分享区域
- 复制链接按钮
- 快捷分享至 Twitter/X

---

### 5.4 标签系统

#### 标签云页（`/tags`）
- 展示所有标签及其文章数量
- 标签字体大小 / 颜色权重按频率浮动（词云效果，可选）

#### 标签详情页（`/tags/[tag]`）
- 标题：「标签：[tag名]」+ 文章数量
- 文章列表（与 `/posts` 风格一致）

---

### 5.5 关于页（`/about`）

- 博主头像 + 姓名
- 详细个人介绍（MDX 支持，便于富文本编辑）
- 技能 / 技术栈展示（图标 + 文字）
- 工作/学习经历时间线（可选）
- 联系方式 / 社交链接
- 简历下载按钮（链接至 PDF，可选）

---

### 5.6 全局组件

#### Header / 导航栏
- Logo（博客名或 SVG LOGO）
- 导航菜单：首页 / 文章 / 标签 / 关于 / 项目
- 移动端：汉堡菜单（抽屉式弹出）
- **亮/暗主题切换按钮**（保存用户偏好至 localStorage）
- 顶部进度条（文章详情页内滚动进度，可选）

#### Footer
- 版权信息（©年份 + 博主名）
- 社交链接图标
- RSS 订阅链接
- 技术栈鸣谢（Built with Next.js...）
- 备案号（可选，视部署地区）

#### 404 页
- 友好提示 + 返回首页按钮
- 可加入彩蛋（如像素小游戏）

---

## 六、UI / UX 规范

### 6.1 主题

| 属性 | 亮色模式 | 暗色模式 |
|---|---|---|
| 背景色 | `#ffffff` / `#f8f8f8` | `#0a0a0a` / `#111111` |
| 前景/文字 | `#171717` | `#ededed` |
| 强调色（Accent） | 待博主确认（推荐品牌色） | 同左/适当调亮 |
| 代码块背景 | `#f4f4f5` | `#1e1e2e` |

- 主题切换依赖 CSS 变量（`data-theme` attr 或 `dark:` Tailwind 类）
- 默认跟随系统（`prefers-color-scheme`），用户可手动覆盖

### 6.2 字体
- 正文/UI：**Geist Sans**（已引入，Google Fonts CDN）
- 代码：**Geist Mono**（已引入）
- 文章正文中文字体回退：`PingFang SC`, `Microsoft YaHei`, `sans-serif`

### 6.3 布局
- 最大内容宽度（`max-w-3xl` ≈ 768px）居中布局，两侧留白
- 文章详情页：正文 + 右侧 TOC 双栏（PC），单栏（移动端）
- 响应式断点：`sm`(640) / `md`(768) / `lg`(1024) / `xl`(1280)

### 6.4 动效
- 页面切换：轻量 fade-in（View Transitions API，Next.js 16 支持）
- 卡片 hover：轻微上移 + 阴影加深
- 主题切换：背景色渐变过渡
- 代码块复制按钮：点击后图标变为 ✓ 并 2s 后还原

---

## 七、SEO 与可访问性

### SEO
- 每页独立 `<title>` 与 `<meta name="description">`
- Open Graph（`og:title`, `og:description`, `og:image`, `og:url`）
- Twitter Card（`twitter:card`, `twitter:image`）
- 文章页结构化数据（`application/ld+json`，`BlogPosting` schema）
- 自动生成 `/sitemap.xml`（Next.js 内置 `sitemap.ts`）
- 自动生成 `/robots.txt`
- Canonical URL 处理

### RSS
- 自动生成 `/rss.xml` 包含所有已发布文章
- 使用 `feed` npm 包（待引入）

### 可访问性（a11y）
- 语义化 HTML 标签（`<main>`, `<nav>`, `<article>`, `<aside>`）
- 图片均配备有意义的 `alt` 文本
- 键盘可访问（Tab 顺序、Focus 样式可见）
- 颜色对比度满足 WCAG AA 标准
- 主题切换按钮有 `aria-label`

---

## 八、性能要求

| 指标 | 目标值 |
|---|---|
| Lighthouse Performance | ≥ 90 |
| Lighthouse SEO | ≥ 95 |
| Lighthouse Accessibility | ≥ 90 |
| Core Web Vitals LCP | < 2.5s |
| Core Web Vitals CLS | < 0.1 |
| Core Web Vitals FID/INP | < 200ms |

- 文章页优先使用 SSG（`generateStaticParams`）
- 图片全部使用 `next/image` 自动优化
- 字体子集化（Geist 仅加载 latin 子集）
- 代码分割、按需加载（Next.js 默认支持）

---

## 九、部署与 CI/CD

- **主部署平台**：Vercel（零配置，自动识别 Next.js）
- **分支策略**：
  - `main` 分支 → 生产环境自动部署
  - PR 分支 → 自动生成 Preview URL
- **环境变量管理**：Vercel Dashboard 配置
- **域名**：自定义域名（待博主提供）

---

## 十、配置化与可维护性

### 10.1 站点全局配置文件（`src/config/site.ts`）
所有可能需要修改的参数集中在此文件中：

```ts
// 示意结构（不是最终代码）
export const siteConfig = {
  name: 'StarKirby Blog',
  description: '...',
  url: 'https://blog.starkirby.dev',
  author: {
    name: 'StarKirby',
    avatar: '/images/avatar.jpg',
    bio: '...',
    social: {
      github: 'https://github.com/StarKirbyyy',
      twitter: '...',
      email: 'mailto:...',
    },
  },
  postsPerPage: 10,
  nav: [...],
};
```

### 10.2 主题颜色配置
- Tailwind CSS 4 中通过 `@theme` 块集中定义设计 token（已在 `globals.css` 中存在基础结构）

---

## 十一、待确认事项（需博主决策）

> [!IMPORTANT]
> 以下内容需要博主确认后才能进入开发阶段

| # | 问题 | 选项 |
|---|---|---|
| 1 | 网站主色调（Accent Color）是什么？ | 待定 |
| 2 | 文章列表偏好卡片式（grid）还是列表式？ | 待定 |
| 3 | 文章分页方式？ | 分页按钮 / 无限滚动 |
| 4 | 是否需要评论功能？用什么方案？ | Giscus / Utterances / 暂不要 |
| 5 | 是否需要搜索功能？ | 全文搜索（Pagefind/FlexSearch）/暂不要 |
| 6 | 是否需要 Projects 页？ | 是 / 否 |
| 7 | 图片点击放大（Lightbox）是否需要？ | 是 / 否 |
| 8 | 数学公式（KaTeX）支持是否需要？ | 是 / 否 |
| 9 | 是否需要 i18n 多语言？ | 中文 / 中英双语 |
| 10 | 自定义域名是什么？ | 待提供 |

---

## 十二、后期迭代规划（Out of Scope for v1）

- 全文搜索（Pagefind / Algolia DocSearch）
- 文章系列/合集（Series）功能
- Newsletter 订阅（Buttondown / ConvertKit）
- 阅读量统计（Vercel Analytics / Umami）
- 多作者支持
- 管理后台（CMS）
