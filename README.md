# StarKirby Blog

这是一个完整的博客系统，目标是把「写作、发布、阅读、互动」放在同一个平台里完成。

## 关键业务

### 1. 内容发布与管理
- 管理员可在后台发布、编辑、管理文章。
- 文章正文支持 Markdown/MDX 渲染。
- 封面图、正文资源支持云端存储（OSS）。

### 2. 内容展示与阅读体验
- 提供首页、文章列表、标签聚合、文章详情页。
- 详情页支持目录（TOC）、代码块、数学公式、脚注等富文本能力。
- 提供文章阅读量统计与基础交互体验优化。

### 3. 用户与权限
- 支持 GitHub OAuth 登录。
- 区分普通用户与管理员权限。
- 支持用户资料管理与后台权限控制。

### 4. 评论与互动
- 支持站内评论流程与后台审核管理。
- 支持切换到 Giscus 评论方案。

### 5. 搜索与内容分发
- 提供基于标题、摘要、标签、正文的全文搜索。
- 支持标签页与 RSS/Sitemap 等内容分发能力。

## 关键技术

### 前端与渲染
- Next.js 16（App Router）
- React 19
- Tailwind CSS 4

### 内容处理
- MDX 渲染链路（`remark` / `rehype`）
- `rehype-pretty-code` + `shiki`（代码高亮）
- `remark-gfm`、`remark-math`、`rehype-katex`（GFM 与公式）

### 后端与数据
- Prisma ORM
- PostgreSQL
- Next.js Route Handlers（API）

### 鉴权与权限
- NextAuth.js（GitHub OAuth）
- 基于角色（`user` / `admin`）的权限控制

### 资源与存储
- 阿里云 OSS（正文与图片资源）

## 当前定位

项目已经具备“可上线博客”的核心闭环：
- 内容生产闭环：写作 → 发布 → 展示
- 用户互动闭环：登录 → 评论 → 管理
