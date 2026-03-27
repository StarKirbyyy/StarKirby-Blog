# blog.azifan.club 页面样式与布局提取（2026-03-27）

## 1. 提取范围与结论

已基于站点地图与关键页面 HTML/CSS 进行提取，覆盖以下模板类型：

- 首页：`/`
- 文章详情：`/white_moonlight/`（同类文章页模板）
- 普通页面：`/aboutme/`
- 友链页（自定义模板）：`/links/`
- Steam 游戏库页（自定义模板）：`/steamlib/`
- 追番页（自定义模板）：`/%E8%BF%BD%E7%95%AA%E5%88%97%E8%A1%A8/`
- 作者归档页：`/author/admin/`
- 分类归档页：`/uncategorized/`

站点地图显示页面集合来源为：

- `wp-sitemap-posts-page-1.xml`
- `wp-sitemap-posts-post-1.xml`
- `wp-sitemap-taxonomies-category-1.xml`
- `wp-sitemap-users-1.xml`

## 2. 全局视觉系统（Design Tokens）

### 2.1 核心变量（从页面 `:root` 与主题 CSS 提取）

- 主文本色：`--theme-skin: #505050`
- 强调色：`--theme-skin-matching: #a4cdf6`
- 深色主题强调：`--theme-skin-dark: #294aa4`
- 全局字重：`--global-font-weight: 300`
- 菜单圆角：`--style_menu_radius: 10px`
- 首页/前景透明：`--homepage_widget_transparency: 0.7`、`--front_background-transparency: 0.7`

### 2.2 字体体系

- 中文衬线：`Noto Serif SC`
- 中文无衬线：`Noto Sans SC`
- 等宽代码：`Fira Code`

### 2.3 视觉语言

- 玻璃态（高频）：
  - 半透明白底：`rgba(255,255,255,0.6~0.9)`
  - `backdrop-filter: saturate(...) blur(...)`
  - 边框：`1px~1.5px solid #fff`
- 阴影体系（高频）：
  - 常态：`0 1px 30px -4px #e8e8e8`
  - hover：`0 1px 20px 10px #e8e8e8`
- 圆角体系：
  - 常规卡片：`10px`
  - 胶囊导航/按钮：`50px`
- 动效：
  - 全局基调：`transition: all 0.6s`
  - 进入动效：`blur/main/homepage-load-animation`
  - 顶部波浪：`banner_wave_1/2` 长周期动画

## 3. 全局布局骨架

### 3.1 Header（固定玻璃导航）

- 顶部固定：`site-header`，桌面高约 `70px`，移动端约 `50px`
- 三段结构：
  - `site-branding`（Logo/站名胶囊）
  - `nav-search-wrapper`（菜单+搜索+背景切换）
  - `user-menu-wrapper`（头像与下拉）
- 移动端：
  - 隐藏桌面导航，启用 `mobile-nav`、`mo_toc_panel`
  - 菜单/目录面板折叠展开

### 3.2 首屏与主容器

- 首屏头图：`headertop` + `centerbg` + `focusinfo`
- 主内容容器：`.site-content { max-width: 860px; padding: 0 20px; margin: 0 auto; }`
- 页脚：`site-footer` 为底部浮层卡片，滚动/状态触发显示

### 3.3 全局交互组件

- 搜索弹层：`search-form--modal`
- 皮肤面板：`skin-menu`（明暗、背景、字体等）
- 回到顶部/换肤浮动按钮：`#moblieGoTop`、`#changskin`

## 4. 页面级模板拆解

## 4.1 首页 `/`

- 首屏信息层：头像、昵称、一言、社交图标、背景切换按钮（`bg-switch`）
- 文章卡片列表（核心）：`article.post.post-list-thumb`
  - 卡片固定高度约 `300px`
  - 结构：
    - `post-thumb`（封面）
    - `post-date`（左上时间胶囊）
    - `post-meta`（右上元信息胶囊）
    - `post-title`（半透明浮层标题）
    - `post-excerpt`（底部摘要）
  - hover：轻微上浮 + 阴影增强
- 分页按钮：`#template-pagination .pagination-next`

## 4.2 文章详情页（以 `/white_moonlight/` 为样本）

- 顶部大图区域：`pattern-center single-center`
- 标题头：`single-header` + `entry-census`（作者/日期/阅读量）
- 正文区：`entry-content`
- 目录区：`toc-container`
- 上下篇导航：`post-squares nextprev`
- 评论区：`comments-main` + `comment-form`

## 4.3 普通页面（以 `/aboutme/` 为样本）

- 使用与文章页接近的主容器
- 内容主体仍在 `entry-content`
- 支持目录容器 `toc-container`
- 无文章上下篇区块

## 4.4 友链页 `/links/`（强定制模板）

- 顶层作用域：`.links-page`（自定义 CSS 变量）
- 卡片网格：`.links ul li`
  - 桌面四列（宽约 `23.1%`）
  - 平板三列（宽约 `31.7%`）
  - 手机两列（宽约 `47%`）
- 卡片元素：
  - `link-avatar-wrapper`（头像 + 在线状态点）
  - `sitename`
  - `linkdes`（单行省略）
- 特性：
  - 头像 hover 旋转
  - 标题下划线动画
  - 提交友链按钮 `submit-link-btn`
  - 友链申请弹窗 `link-modal`

## 4.5 Steam 游戏库页 `/steamlib/`（强定制模板）

- 容器：`.steam-row` flex 换行
- 卡片：`.steam-card`
  - 桌面四列（`23%`）
  - 中屏三列（`31%`）
  - 手机单列（`96.5%`）
- 卡片结构：
  - `steam-card-image`（封面）
  - `steam-title-overlay`（顶部标题覆层）
  - `steam-info`（底部统计信息）
  - `steam-stat`（时长/更新时间）
- 动效：
  - hover 上浮与图片缩放
  - 覆层淡出、信息区显现
  - `::before/::after` 光泽与描边效果

## 4.6 追番页 `/%E8%BF%BD%E7%95%AA%E5%88%97%E8%A1%A8/`（强定制模板）

- 容器：`.bangumi .row` + `.column`
- 卡片：`.bangumi-item`（封面背景 + 信息滑层）
- 信息层：`.bangumi-info`
  - 标题：`.bangumi-title`
  - 摘要：`.bangumi-summary`
  - 进度条：`.bangumi-status` + `.bangumi-status-bar`
- 响应式列数：
  - `<400`：1 列
  - `>=400`：2 列
  - `>=600`：3 列
  - `>=900`：4 列 + hover 滑层/封面模糊
  - `>=1200`：进一步调整信息层露出比例

## 4.7 作者归档 `/author/admin/`

- 作者信息头块：`author_info` + `author-center`
- 下方复用首页文章卡片流：`post-list-thumb`
- 页面风格与首页一致，但顶部换为作者资料区

## 4.8 分类归档 `/uncategorized/`

- 归档页头 + 首页同款文章卡片流
- 结构复用程度高，主要差异在页面语义与数据源

## 5. 响应式与终端策略

- 主断点：`860px`（桌面导航切移动导航、正文/评论适配）
- 次断点：`1024px`、`768px`、`630px`、`480px`
- 典型策略：
  - 复杂悬停交互在移动端弱化或关闭
  - 网格列数阶梯收缩（4/3/2/1）
  - 正文区与评论区改为更紧凑内边距

## 6. 可直接复用的实现原则（用于本项目重构）

- 统一“玻璃胶囊 + 浮层卡片 + 低饱和浅色阴影”基调
- 核心容器维持 `~860px` 阅读宽度，避免内容区过宽
- 所有列表页统一使用“封面卡 + 顶部 meta 胶囊 + 底部摘要”模式
- 特殊页面（友链/Steam/追番）保留独立 CSS 变量作用域，避免污染全局
- 明暗模式通过变量切换，不通过重复组件实现

## 7. 参考源

- `https://blog.azifan.club/`
- `https://blog.azifan.club/white_moonlight/`
- `https://blog.azifan.club/aboutme/`
- `https://blog.azifan.club/links/`
- `https://blog.azifan.club/steamlib/`
- `https://blog.azifan.club/%E8%BF%BD%E7%95%AA%E5%88%97%E8%A1%A8/`
- `https://blog.azifan.club/author/admin/`
- `https://blog.azifan.club/uncategorized/`
- `https://blog.azifan.club/wp-sitemap.xml`
- `https://blog.azifan.club/wp-content/themes/Sakurairo/css/?iro_header&sakura&wave&minify&3.0.4`
