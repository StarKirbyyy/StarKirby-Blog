# StarKirby Blog — 云端内容发布需求文档

> 版本：v0.2（实施中）  
> 日期：2026-03-26  
> 关联文档：[需求文档 requirements.md](./requirements.md) / [开发流程文档 dev-roadmap.md](./dev-roadmap.md)

---

## 一、背景与现状

当前文章发布链路为：
`/admin/publish` 上传文件 → 服务端写入 GitHub 仓库（`content/posts` / `public/images/covers`）→ 触发部署后生效。

现状约束：
- 内容读取依赖本地文件系统（`src/lib/posts.ts` 扫描 `content/posts/`）。
- 发布依赖 GitHub Token、仓库权限与分支写入成功。
- 内容发布与代码仓库强耦合，失败面较多（401/403、分支保护、API 限流等）。

目标变更：将“文章与封面”改为上传到云端存储，不再写入 GitHub 仓库。

### 实施状态（2026-03-26）
- [x] M1：数据层与读取链路（Post 模型 + 数据库优先读取）
- [x] M2：发布接口云端化（OSS 上传 + Post upsert）
- [x] M3：页面与 SEO 联动（发布后 revalidate）
- [x] M4：运维收尾（后台文章管理 + GitHub 发布链路清理）

---

## 二、建设目标

### 2.1 核心目标
- 发布文章时，Markdown/MDX 正文与元数据写入云端内容系统（数据库为主）。
- 封面图上传到云端对象存储，页面直接使用公网 URL。
- 去除发布对 GitHub 仓库写权限的依赖。
- 保持现有访问路径不变（`/posts/[slug]`、`/tags`、`/rss.xml`、`/sitemap.xml`）。

### 2.2 兼容目标
- 继续支持 `.md` / `.mdx` 上传。
- 继续支持 frontmatter 自动补全能力（`title/description/date/tags/slug`）。
- 评论系统、用户系统、后台权限模型保持不变（复用 `admin` 鉴权）。

---

## 三、范围定义（Scope）

### 3.1 V1 必做范围（MVP）
- 云端内容存储（PostgreSQL）：
  - 保存文章元数据与原始 Markdown/MDX 文本。
- 云端资源存储（阿里云 OSS）：
  - 保存封面图，返回可访问 URL。
- 发布后台改造：
  - `/api/admin/publish` 从“写 GitHub”切换为“写数据库 + 对象存储”。
- 读取链路改造：
  - `getAllPosts/getPostBySlug/getAllTags/getPostsByTag` 支持数据库读取。
- SEO 联动：
  - `sitemap.xml`、`rss.xml` 从云端文章源生成。
- 审计日志：
  - 文章创建、更新、发布、下线、删除记录 `AuditLog`。

### 3.2 V1 不做范围（Out of Scope）
- 富文本可视化编辑器。
- 多人协同编辑、冲突合并。
- 文章版本 diff 展示（可预留）。
- 全文检索引擎（Pagefind/Meilisearch）。

### 3.3 V1.5 预留范围
- 文章版本历史（PostRevision）。
- 定时发布（scheduled publish）。
- 草稿协作与审批流。

---

## 四、技术方案与选型

### 4.1 推荐方案（V1）
- 元数据与正文：PostgreSQL（Prisma）。
- 封面图/正文文件：阿里云 OSS（对象存储）。
- 渲染：沿用现有 MDX 渲染管线（`src/lib/mdx.ts`）。

选择理由：
- 项目已接入 PostgreSQL/Prisma，迁移成本低。
- 只需把“发布写入端 + 读取端”切换为数据库，不需要改 UI 交互。
- 可继续在 Next.js 服务端安全处理上传与解析。

### 4.2 内容格式策略
- 支持 `.md`、`.mdx`。
- 上传后统一保存“正文文本 + 结构化元数据”。
- MDX 安全策略（V1）：不开放任意远程 import，仅允许 Markdown 与站内已注册组件映射。

---

## 五、功能分解（需求拆解）

## 模块 A：内容数据层（Content Domain）

### A1 文章实体
- 新增 `Post` 模型（建议）：
  - `id`, `slug`, `title`, `description`, `date`, `updated`, `tags`, `coverUrl`, `sourceUrl`, `draft`, `readingTime`, `authorId`, `createdAt`, `updatedAt`, `publishedAt`。
- `slug` 全局唯一，冲突时阻止发布或提示改名。

### A2 状态管理
- V1 最小状态：`draft`（布尔）与 `publishedAt`。
- 生产环境默认不展示 `draft` 内容。

## 模块 B：上传与发布（Admin Publish）

### B1 上传输入
- 继续沿用当前表单：
  - `postFile(.md/.mdx)`、`coverFile(可选)`、`title`、`description`、`tags`、`date`、`slug`。

### B2 frontmatter 规则
- 若文件缺失字段，按现有规则补全：
  - `title`：表单值 > Markdown H1 > slug
  - `description`：表单值 > 正文首段摘要
  - `date`：表单值 > 系统日期（`YYYY-MM-DD`）
  - `tags`：frontmatter > 表单输入

### B3 发布动作
- 封面图上传对象存储，得到 `coverUrl`。
- 文章入库（upsert by slug）。
- 写入审计日志（`post.create` / `post.update` / `post.publish`）。

## 模块 C：读取与渲染（Public Read）

### C1 内容读取接口
- `src/lib/posts.ts` 改造为“数据库优先”读取。
- 可保留“文件系统回退模式”（迁移期可选）。

### C2 渲染与缓存
- 文章页服务端渲染 MDX。
- 发布/更新后触发缓存失效（`revalidatePath` 或 `revalidateTag`）。

### C3 标签/列表
- `/posts`、`/tags`、`/tags/[tag]` 全部由数据库聚合。

## 模块 D：资源存储（Asset Storage）

### D1 封面图规则
- 限制格式：`png/jpg/jpeg/webp/avif/gif/svg`（与当前一致）。
- 限制大小（V1 建议）：<= 5MB。
- 命名建议：`covers/{slug}-{timestamp}.{ext}`。

### D2 URL 策略
- 前端只存储并使用可公开访问 URL。
- 删除文章时可选清理封面资源（V1 可延后为异步任务）。

## 模块 E：运营与审计（Governance）

### E1 权限
- 仅 `admin` 可调用发布与管理接口。
- 继续检查 `status !== disabled`。

### E2 审计
- 关键事件写入 `AuditLog`：
  - `post.create`, `post.update`, `post.delete`, `post.publish`, `post.unpublish`
- 审计字段需包含：操作者、目标 postId/slug、关键变更摘要。

---

## 六、接口需求（V1）

| 接口 | 方法 | 描述 | 权限 |
|---|---|---|---|
| `/api/admin/publish` | `POST` | 上传并创建/更新文章（替换 GitHub 写入） | `admin` |
| `/api/admin/posts` | `GET` | 后台文章列表（分页/过滤） | `admin` |
| `/api/admin/posts/:id` | `PATCH` | 更新元数据/正文 | `admin` |
| `/api/admin/posts/:id` | `DELETE` | 删除文章（软删或硬删） | `admin` |
| `/api/admin/posts/:id/publish` | `POST` | 发布或取消发布（可选） | `admin` |

接口约束：
- 写接口统一返回错误结构：`{ code, message, requestId }`（建议）。
- `401` 未登录，`403` 无权限，`422` 参数校验失败。

---

## 七、数据模型建议（Prisma 草案）

```prisma
model Post {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  date        DateTime
  updated     DateTime?
  tags        String[]
  coverUrl    String?
  draft       Boolean  @default(false)
  sourceUrl   String
  readingTime String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id], onDelete: Restrict)
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date, createdAt])
  @@index([draft, date])
}
```

说明：
- `sourceUrl` 保存 OSS 正文地址。
- `date` 使用 `DateTime`，输入仍支持 `YYYY-MM-DD`。

---

## 八、环境变量需求（格式）

### 8.1 通用
```bash
CONTENT_SOURCE=database
```

### 8.2 对象存储（阿里云 OSS）
```bash
ALIYUN_OSS_BUCKET=your-bucket-name
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_ACCESS_KEY_ID=LTAIxxxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxxx
# 可选
ALIYUN_OSS_SECURITY_TOKEN=xxxx
ALIYUN_OSS_PUBLIC_BASE_URL=https://cdn.example.com
```

说明：`sourceUrl/coverUrl` 最终存入数据库，渲染时直接使用。

---

## 九、非功能需求

### 9.1 性能
- 文章详情页 P95 服务端渲染时间 < 500ms（不含冷启动）。
- 发布接口单次处理（含图片上传）目标 < 3s（中位）。

### 9.2 安全
- 上传接口仅管理员可访问。
- 文件类型与大小严格校验，拒绝可执行脚本。
- 不信任用户 frontmatter，服务端二次规范化。

### 9.3 可用性
- 上传失败时返回可读错误，不产生脏数据。
- 支持幂等更新（同 slug 重复提交可更新而非重复创建）。

---

## 十、实施里程碑（建议）

### M1：数据层与读取链路（1~2 天）
- 新增 `Post` 模型与迁移。
- `src/lib/posts.ts` 增加数据库读取能力（可带文件回退）。

### M2：发布接口云端化（1~2 天）
- `/api/admin/publish` 改为“对象存储 + 数据库”。
- 保留 frontmatter 自动补全逻辑。

### M3：页面与 SEO 联动（1 天）
- `/posts`、`/posts/[slug]`、`/tags`、`rss.xml`、`sitemap.xml` 改读数据库。
- 增加发布后缓存失效。

### M4：运维与收尾（0.5~1 天）
- 审计日志打通。
- 删除 GitHub 发布相关环境变量与文档。

---

## 十一、验收标准（DoD）

- 管理员可在后台上传 `.md/.mdx` 与封面图，成功发布后可立即访问文章。
- 发布流程不再依赖 `GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO`。
- 文章列表、详情、标签、RSS、Sitemap 均可读取云端文章。
- `draft` 文章在生产环境默认不可见。
- 关键后台操作具备审计记录。

---

## 十二、风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| MDX 运行时渲染开销上升 | 首次访问变慢 | 缓存 + 预编译/ISR |
| 对象存储权限配置错误 | 封面图 403/404 | 启动自检 + 上传后回读校验 |
| slug 冲突 | 覆盖风险 | 发布前唯一性检查 + 明确提示 |
| 迁移期双数据源不一致 | 内容错乱 | 设置单一主源（database），回退仅短期启用 |

---

## 十三、待确认事项（必须决策）

1. V1 对象存储最终采用 `Vercel Blob` 还是 `S3/R2`？
2. 文章删除采用“软删（可恢复）”还是“硬删（不可恢复）”？
3. 是否保留“同 slug 更新覆盖”语义，还是强制新 slug？
4. 是否在 V1 就提供“文章编辑页”（不仅上传页）？
5. 是否保留文件系统回退读取（迁移期）？
