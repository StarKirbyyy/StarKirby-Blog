# StarKirby Blog — 开发流程文档

> 版本：v0.1（草稿）
> 日期：2026-03-24
> 配套文档：[需求文档 requirements.md](./requirements.md)

---

## 开发原则

- **自底向上**：先打好基础设施，再叠加功能层
- **可见即可用**：每个阶段结束后，博客都处于可运行、可预览状态
- **内容优先**：尽早让文章能被渲染，视觉美化在后期打磨

---

## 阶段一：基础设施 & 设计系统

> 目标：搭建项目骨架，后续所有开发都建立在这一层之上

### 1.1 项目配置
- [x] 配置 `src/config/site.ts`（站点名、作者、社交链接、每页文章数等）
- [x] 清理脚手架默认代码（`page.tsx`、`layout.tsx`）
- [x] 配置 `tsconfig.json` 路径别名（`@/` → `src/`）

### 1.2 设计 Token & 全局样式
- [x] 在 `globals.css` 中通过 `@theme` 定义颜色、字体、间距等设计 Token
- [x] 确定主色调（Accent Color）
- [x] 配置中文字体回退（`PingFang SC`、`Microsoft YaHei`）
- [x] 配置亮/暗主题 CSS 变量

### 1.3 全局布局组件
- [x] `RootLayout`：更新 `layout.tsx`，注入主题类、语言属性
- [x] `Header`：Logo + 导航菜单 + 主题切换按钮（桌面端）
- [x] `Header`：移动端汉堡菜单（抽屉式）
- [x] `Footer`：版权信息 + 社交链接 + RSS 入口
- [x] 主题切换逻辑：读写 `localStorage`，初始跟随系统

**📍 阶段产出**：能看到完整的 Header + Footer，主题可切换

---

## 阶段二：内容管理层（MDX）

> 目标：让博客能读取并渲染本地 MDX 文章

### 2.1 依赖引入
- [x] 安装 `@next/mdx`（已选型）
- [x] 安装 `gray-matter`（解析 frontmatter）
- [x] 安装 `reading-time`（自动计算阅读时长）
- [x] 安装 `rehype-pretty-code` + `shiki`（代码高亮）
- [x] 安装 `rehype-slug` + `rehype-autolink-headings`（标题锚点）
- [x] 安装 `remark-gfm`（GFM 语法支持）

### 2.2 内容工具函数（`src/lib/posts.ts`）
- [x] `getAllPosts()`：扫描 `content/posts/` 目录，返回所有文章元数据列表
- [x] `getPostBySlug(slug)`：读取单篇文章内容 + frontmatter
- [x] `getAllTags()`：聚合所有标签及其文章数
- [x] `getPostsByTag(tag)`：按标签过滤文章
- [x] 自动过滤 `draft: true` 的文章（生产环境）

### 2.3 创建示例文章
- [x] 在 `content/posts/` 下创建 2~3 篇示例 `.mdx` 文章（包含代码块、图片、表格等）用于调试

**📍 阶段产出**：`getAllPosts()` 能正确返回文章数据，示例文章可被读取

---

## 阶段三：核心页面开发

> 目标：实现博客的基本可读性，用户能浏览和阅读文章

### 3.1 文章详情页 `/posts/[slug]`（最高优先级）
- [x] `generateStaticParams()`：SSG 预生成所有文章页
- [x] `generateMetadata()`：动态生成 SEO title / description / og tags
- [x] 文章标题、元信息（日期、阅读时长、标签）渲染
- [x] MDX 正文渲染（含自定义组件映射）
- [x] `@tailwindcss/typography` prose 排版样式
- [x] 代码块：语言标识 + 复制按钮
- [x] 目录（TOC）组件：右侧 sticky（桌面） / 隐藏（移动端）

### 3.2 文章列表页 `/posts`
- [x] 文章列表渲染（标题、日期、摘要、标签、阅读时长）
- [x] 按日期倒序排列
- [x] 分页组件（确认方式后实现）

### 3.3 首页 `/`
- [x] Hero 区块：头像、博主名、简介、社交链接
- [x] 最新文章预览（取最新 5 篇）
- [x] 「查看全部文章」入口

### 3.4 标签页 `/tags` & `/tags/[tag]`
- [x] 标签云（所有标签 + 文章数）
- [x] 标签详情文章列表

**📍 阶段产出**：博客核心功能完整，可发布内容并正常阅读

---

## 阶段四：SEO & 自动化

> 目标：让博客被搜索引擎正确收录

- [x] `src/app/sitemap.ts`：自动生成 Sitemap
- [x] `src/app/robots.ts`：生成 robots.txt
- [x] 所有页面的 Open Graph 图片（`og:image`）
  - 可用 Next.js `ImageResponse` 动态生成文章封面 OG 图
- [x] 文章页结构化数据（`BlogPosting` JSON-LD）
- [x] RSS Feed：`/rss.xml`（安装 `feed` 包）
- [x] Canonical URL 配置

**📍 阶段产出**：Lighthouse SEO 评分 ≥ 95

---

## 阶段五：关于页 & 项目页

- [x] 关于页 `/about`：头像、简介（MDX）、技能标签、联系方式
- [x] 项目展示页 `/projects`（若需要）：项目卡片列表
- [x] 自定义 404 页面

**📍 阶段产出**：博客内容完整，所有页面可访问

---

## 阶段六：性能优化 & 打磨

> 目标：Lighthouse 各项指标达标，用户体验精细化

- [x] 所有图片改用 `next/image` 并配置适当 `sizes`
- [x] 页面切换动效（View Transitions API）
- [x] 卡片 hover 微动效、主题切换过渡动画
- [x] 代码块复制成功反馈动画（✓ 图标）
- [x] 字体子集化确认（Geist 仅 latin）
- [x] Vercel Analytics 集成（页面性能监控）
- [ ] Lighthouse 全项跑分，针对性优化

**📍 阶段产出**：Lighthouse Performance ≥ 90，体验流畅

---

## 阶段七：部署 & 上线

- [x] 连接 Vercel，配置自动部署（`main` 分支 → 生产）
- [x] 绑定自定义域名
- [x] 配置环境变量（`SITE_URL` 等）
- [x] 发布第一篇正式文章
- [ ] 提交 Google Search Console + Sitemap

**📍 阶段产出**：🎉 博客正式上线

---

## 阶段八：可选增强功能（迭代）

> 根据需求文档第十一节确认后决定是否实现

- [x] 用户系统需求分解与需求文档（`documents/user-system-requirements.md`）
- [x] 用户系统 M1：认证骨架（Auth.js + Prisma + PostgreSQL）与 GitHub OAuth 登录闭环
- [x] 用户系统 M2：用户资料页与资料接口
- [x] 用户系统 M3：RBAC 与后台路由/API 权限保护
- [x] 评论系统：Giscus（基于 GitHub Discussions）
- [ ] 全文搜索：Pagefind（纯静态，零成本）
- [ ] 文章点赞/阅读量：Vercel KV
- [x] 数学公式：KaTeX + rehype-katex
- [x] 图片 Lightbox（点击放大预览）
- [ ] Newsletter：Buttondown

---

## 各阶段时间估算（供参考）

| 阶段 | 预计工时 |
|---|---|
| 一：基础设施 | 2~3 天 |
| 二：内容管理层 | 1~2 天 |
| 三：核心页面 | 3~5 天 |
| 四：SEO & 自动化 | 1~2 天 |
| 五：关于 & 项目页 | 1 天 |
| 六：性能优化 | 1~2 天 |
| 七：部署上线 | 半天 |
| **合计 v1.0** | **约 2~3 周** |
