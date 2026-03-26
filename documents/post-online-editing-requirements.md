# StarKirby Blog — 在线文章修改与 Typora 风格编辑器需求文档

> 版本：v0.1（需求分析）  
> 日期：2026-03-26  
> 关联文档：[云端内容发布需求文档](./cloud-publish-requirements.md) / [用户系统需求文档](./user-system-requirements.md) / [开发流程文档](./dev-roadmap.md)

### 实施状态（2026-03-26）
- [x] M1：编辑页骨架与读取链路（支持元数据 + Markdown 在线编辑与保存）
- [x] M2：Typora 风格编辑体验增强（工具栏、快捷键、实时预览、编辑/预览模式切换）
- [ ] M3：编辑器内图片上传与自动插入
- [ ] M4：发布流程与冲突控制
- [ ] M5：版本历史与回滚

---

## 一、背景与问题

当前系统已经支持：
- 后台上传文章（`.md/.mdx`）并发布到云端（PostgreSQL + OSS）。
- 前台按 `slug` 读取并渲染文章。

当前缺口：
- 已发布文章无法在后台“在线直接修改”正文与图片。
- 修改流程依赖本地编辑并重新上传，效率低且容易引入版本混乱。
- 缺乏接近 Typora 的编辑体验（所见即所得、即时预览、快捷键友好）。

---

## 二、建设目标

### 2.1 核心目标
- 支持管理员在网站后台直接编辑已有文章的正文与元数据。
- 提供“类似 Typora”的在线 Markdown 编辑体验（单编辑区、即时格式反馈）。
- 支持在编辑器内上传/替换图片，自动存储到 OSS 并插入 Markdown。
- 保证编辑操作可审计、可回滚、可安全发布。

### 2.2 成功标准（验收口径）
- 管理员可在 3 分钟内完成“打开文章 → 修改正文和图片 → 保存发布”。
- 编辑后文章页可在缓存刷新后正确展示新内容（正文、封面、标签、描述）。
- 关键写操作（保存、发布、删除）100%记录审计日志。
- 不发生未授权用户编辑文章的越权问题。

---

## 三、范围定义

### 3.1 V1 必做范围
- 文章编辑页（从后台文章列表进入）。
- 在线 Markdown 编辑器（Typora 风格体验）。
- 元数据编辑（title/description/tags/date/slug/draft/cover）。
- 编辑器内图片上传与插入。
- 保存草稿、发布更新、取消发布。
- 编辑冲突检测与基础版本管理（至少最近一次版本快照）。

### 3.2 V1 不做范围
- 多人实时协同编辑（OT/CRDT）。
- 可视化 diff 对比 UI（仅保留历史版本数据）。
- 移动端完整编辑体验（V1 先保证桌面端可用）。

---

## 四、角色与权限

| 角色 | 权限 |
|---|---|
| `admin` | 可查看文章列表、进入编辑器、保存/发布/下线/删除文章 |
| `user` | 无后台编辑权限 |
| `disabled` 用户 | 禁止访问编辑接口与页面 |

鉴权规则：
- 所有编辑相关接口必须登录且 `role=admin` 且 `status=active`。
- 非法访问返回 `401/403`，并可记录审计事件（可选）。

---

## 五、核心用户流程

### 5.1 编辑流程（主流程）
1. 管理员进入 `/admin/posts`，点击“编辑”。
2. 系统加载文章元数据与 Markdown 正文。
3. 在在线编辑器修改正文、插入/替换图片。
4. 编辑元数据（标签、描述、日期、封面等）。
5. 点击“保存草稿”或“发布更新”。
6. 系统写入数据库与 OSS，记录审计日志，触发页面缓存失效。

### 5.2 图片编辑流程
1. 在编辑器拖拽/粘贴/选择图片。
2. 客户端上传到 `/api/admin/posts/:id/assets`。
3. 服务端上传 OSS，返回 URL。
4. 编辑器自动插入 `![alt](url)` 到光标位置。

### 5.3 冲突处理流程
1. 打开编辑页时返回 `revision`（或 `updatedAt`）。
2. 保存时携带版本标识。
3. 若版本不一致，返回 `409` 并提示“内容已被他人更新”。

---

## 六、功能需求分解

## 模块 A：后台文章管理入口

### A1 列表增强
- 在 `/admin/posts` 增加“编辑”按钮。
- 每行展示文章状态：`draft/published`、更新时间、作者。

### A2 导航与可用性
- 支持“新窗口打开编辑页”。
- 支持按 `title/slug/tag/status` 搜索过滤（复用现有筛选能力）。

## 模块 B：Typora 风格在线编辑器

### B1 体验要求
- 单栏编辑体验，输入时即时看到 Markdown 语义效果。
- 光标所在段落保留原生可编辑状态，不使用复杂块级弹窗打断输入。
- 常用快捷键可用：`Ctrl/Cmd+B`、`I`、`K`、`Shift+K`（代码块）等。

### B2 基础编辑能力
- 标题、列表、引用、代码块、表格、任务列表、链接、图片、分割线。
- 与现有渲染链路兼容（remark/rehype/MDX）。
- 支持直接编辑原始 Markdown 文本，不破坏已有 frontmatter 语法。

### B3 预览与校验
- 编辑时提供实时预览区域或同屏渲染反馈（实现方案可选）。
- 保存前校验 frontmatter 与正文结构合法性。
- 对非法内容给出定位错误信息（行号或字段）。

## 模块 C：元数据编辑器

### C1 字段
- `title`（必填）
- `description`（必填）
- `tags`（可多选/输入）
- `date`（可选，不填默认当前日期）
- `slug`（必填，唯一）
- `draft`（草稿状态）
- `coverUrl`（可选，支持上传）

### C2 自动补全策略
- `title` 默认取 Markdown 一级标题（若存在）。
- `description` 默认取正文首段摘要。
- `date` 默认系统日期（`YYYY-MM-DD`）。

## 模块 D：图片与资源管理

### D1 上传能力
- 支持拖拽、粘贴、文件选择三种上传方式。
- 支持类型：`png/jpg/jpeg/webp/avif/gif/svg`。
- 单文件大小限制（建议）`<= 5MB`。

### D2 存储规范
- 路径建议：`posts/{slug}/assets/{timestamp}-{rand}.{ext}`。
- 上传成功后返回可访问 URL，插入正文。
- 删除文章时资源清理策略：V1 可不自动删，后续异步回收。

## 模块 E：保存、发布与历史

### E1 保存模型
- `保存草稿`：只更新内容，不对外发布。
- `发布更新`：更新内容并设 `draft=false`。
- `下线`：设 `draft=true`（不删除内容）。

### E2 自动保存
- 支持间隔自动保存（建议 15~30 秒，内容有变更才触发）。
- 页面离开前若存在未保存改动，弹出确认提示。

### E3 版本记录
- 每次“手动保存/发布”写入一条版本快照（`PostRevision`）。
- 至少支持“回滚到上一版本”（V1 可后端能力先行，UI 可简化）。

## 模块 F：安全与审计

### F1 审计事件
- `post.edit.open`
- `post.edit.save_draft`
- `post.edit.publish`
- `post.edit.unpublish`
- `post.edit.rollback`

### F2 内容安全
- 服务端校验输入与文件类型。
- 防止恶意脚本注入（frontmatter 与 MDX 组件白名单策略）。

---

## 七、数据模型建议（Prisma 增量）

在现有 `Post` 基础上新增版本表：

```prisma
model PostRevision {
  id          String   @id @default(cuid())
  postId       String
  post         Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  title        String
  description  String
  date         DateTime
  updated      DateTime?
  tags         String[] @default([])
  coverUrl     String?
  sourceUrl    String
  draft        Boolean  @default(false)
  editorUserId String?
  editorUser   User?    @relation(fields: [editorUserId], references: [id], onDelete: SetNull)
  createdAt    DateTime @default(now())

  @@index([postId, createdAt])
}
```

说明：
- `Post` 保持“当前最新版本”。
- `PostRevision` 保存关键版本快照用于审计和回滚。

---

## 八、接口需求（V1）

| 接口 | 方法 | 说明 | 权限 |
|---|---|---|---|
| `/api/admin/posts/:id` | `GET` | 获取文章详情（元数据 + 正文） | `admin` |
| `/api/admin/posts/:id` | `PATCH` | 保存元数据与正文（支持 `draft`） | `admin` |
| `/api/admin/posts/:id/publish` | `POST` | 发布或下线文章 | `admin` |
| `/api/admin/posts/:id/assets` | `POST` | 上传正文图片并返回 URL | `admin` |
| `/api/admin/posts/:id/revisions` | `GET` | 获取版本历史（可分页） | `admin` |
| `/api/admin/posts/:id/revisions/:rid/restore` | `POST` | 回滚到指定版本 | `admin` |

统一约束：
- 写操作需携带版本字段（`revision` 或 `updatedAt`）用于冲突检测。
- 错误结构统一：`{ code, message, requestId }`。
- `409` 表示版本冲突，`422` 表示校验失败。

---

## 九、页面与路由建议

| 路由 | 说明 |
|---|---|
| `/admin/posts` | 文章管理列表（新增“编辑”入口） |
| `/admin/posts/[id]/edit` | 在线编辑器页面 |
| `/admin/posts/[id]/history` | 版本历史页（V1 可选） |

页面状态要求：
- 加载中骨架屏。
- 保存中状态条。
- 保存成功/失败提示。
- 未保存离开拦截。

---

## 十、非功能需求

### 10.1 性能
- 编辑器首屏可交互时间 < 2 秒（桌面端，常规网络）。
- 单次保存接口 P95 < 800ms（不含大图上传）。

### 10.2 可靠性
- 自动保存失败不丢本地输入（可临时保存在浏览器内存或 local draft）。
- 图片上传失败不影响正文继续编辑。

### 10.3 兼容性
- 桌面端 Chrome/Edge/Safari 最新两个大版本可用。
- 生产渲染结果与当前文章页 MDX 渲染保持一致。

---

## 十一、里程碑拆解（建议）

### M1：编辑页骨架与读取链路
- 新增 `/admin/posts/[id]/edit` 页面。
- 接入文章详情读取接口。
- 实现元数据表单与基础 Markdown 文本编辑。

验收：
- 能加载已有文章并保存纯文本改动。

### M2：Typora 风格编辑器体验
- 引入并封装编辑器内核（候选：Milkdown / Tiptap Markdown / Toast UI）。
- 打通快捷键、即时预览与基础语法工具栏。

验收：
- 日常 Markdown 写作与现有渲染兼容。

### M3：图片上传与插入
- 实现编辑器内图片上传 API。
- 支持拖拽/粘贴自动上传并回填 URL。

验收：
- 上传成功即可在正文显示，发布后前台可访问。

### M4：发布流程与冲突控制
- 保存草稿、发布、下线。
- 版本冲突检测（`409`）。
- 审计日志补全。

验收：
- 双人同时编辑时可识别冲突并阻止覆盖。

### M5：版本历史与回滚
- 保存版本快照。
- 提供最小回滚能力（最近版本恢复）。

验收：
- 误改后可恢复到上一个稳定版本。

---

## 十二、风险与待确认项

待确认：
- Typora 风格是“单栏即时渲染”还是“左编右预览”可接受。
- 是否允许正文内使用自定义 MDX 组件（白名单范围）。
- 历史版本保留策略（永久保留或按条数/时间淘汰）。

主要风险：
- 编辑器选型若与现有 MDX 渲染差异大，会导致“编辑态和展示态不一致”。
- 图片大量上传可能带来 OSS 成本与清理压力。
- 版本冲突如果只做后端拦截，用户体验需要明确提示与恢复路径。
