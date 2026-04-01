---
title: "Markdown / MDX 全要素渲染测试文档"
description: "用于验证文章页在标题、段落、列表、表格、代码高亮、数学公式、图片、脚注、HTML 标签等场景下的渲染表现。"
date: "2026-03-31"
updated: "2026-03-31"
tags: ["测试", "Markdown", "MDX", "排版"]
cover: "https://picsum.photos/1600/900?grayscale&blur=1"
draft: false
slug: "md-render-test"
---

# Markdown / MDX 全要素渲染测试文档

这是一篇用于**样式回归测试**的文章，覆盖尽可能多的 Markdown/MDX 元素。  
请检查字体、间距、颜色、对齐、响应式、暗色模式与交互状态是否正常。

---

## 目录跳转测试

- [跳到二级标题：文本样式](#文本样式)
- [跳到二级标题：列表](#列表测试)
- [跳到二级标题：代码块](#代码块测试)
- [跳到二级标题：数学公式](#数学公式测试)
- [跳到二级标题：表格](#表格测试)

---

## 文本样式

普通段落：听闻有人觉得我对白月光的念念不忘包含了我小维男的性压抑幻想的时候，我是惊讶的。

强调测试：*斜体*、**粗体**、***粗斜体***、~~删除线~~、`行内代码`。

中英混排测试：The quick brown fox jumps over the lazy dog. 0123456789.

长段落换行测试：  
这一行末尾使用了两个空格触发换行。  
这是换行后的下一行。

上标/下标（HTML）：H<sub>2</sub>O，E = mc<sup>2</sup>。

键盘按键（HTML）：按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 打开搜索。

---

## 标题层级测试

### 三级标题示例

#### 四级标题示例

##### 五级标题示例

###### 六级标题示例

---

## 引用测试

> 这是一级引用。
>
> - 引用中的列表项 A
> - 引用中的列表项 B
>
> > 这是二级嵌套引用。

---

## 列表测试

### 无序列表

- 一级 A
- 一级 B
  - 二级 B-1
  - 二级 B-2
    - 三级 B-2-a

### 有序列表

1. 第一项
2. 第二项
   1. 第二项-子项 1
   2. 第二项-子项 2
3. 第三项

### 任务列表（GFM）

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 待确认任务

---

## 链接与图片测试

### 链接

- 行内链接：[项目首页](/)
- 外部链接：[GitHub](https://github.com/)
- 自动链接：<https://blog.starkirby.top>

### 图片

本地图片（如果存在）：

![本地图片测试](/images/avatar.svg)

远程图片：

![远程图片测试](https://picsum.photos/1000/420)

---

## 代码块测试

### Bash

```bash
pnpm install
pnpm dev
pnpm build
```

### TypeScript

```ts
type User = {
  id: string;
  name: string;
  role: "user" | "admin";
};

function greet(user: User) {
  return `Hello, ${user.name} (${user.role})`;
}

console.log(greet({ id: "1", name: "Kirby", role: "admin" }));
```

### JSON

```json
{
  "name": "starkirby-blog",
  "version": "0.1.0",
  "private": true
}
```

### Diff

```diff
- const fontSize = "1.0rem";
+ const fontSize = "1.4rem";
```

---

## 表格测试

| 列名 | 左对齐 | 居中 | 右对齐 |
| :--- | :--- | :---: | ---: |
| 行 1 | 文本 A | 文本 B | 100 |
| 行 2 | `code` | **bold** | 9999 |
| 行 3 | [link](https://example.com) | ~~del~~ | 42 |

---

## 数学公式测试

行内公式：$E = mc^2$，$\int_0^1 x^2 \, dx = \frac{1}{3}$。

块级公式：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

多行公式：

$$
\begin{aligned}
f(x) &= x^2 + 2x + 1 \\
     &= (x+1)^2
\end{aligned}
$$

---

## 脚注测试（GFM）

这是一个脚注示例[^1]，这是另一个脚注示例[^long-note]。

[^1]: 这是简短脚注内容。
[^long-note]: 这是较长脚注内容。用于测试脚注区域的字号、行距与分隔样式是否正常。

---

## HTML 标签测试

<details>
  <summary>点击展开详情（details/summary）</summary>
  <p>这里是展开后的内容，测试 HTML 标签在 MDX 中的渲染。</p>
</details>

<mark>高亮文本（mark）</mark>

---

## 分隔线与转义测试

以下是分隔线：

---

需要转义的字符：\* \_ \` \# \[ \] \( \)

---

## 最终检查清单

- [ ] 标题层级字号是否符合预期
- [ ] 正文字号/行距是否易读
- [ ] 链接颜色与 hover 状态是否正确
- [ ] 代码块主题（浅色/深色）是否正确
- [ ] 数学公式是否正常显示
- [ ] 表格在移动端是否可横向滚动
- [ ] 脚注样式是否清晰
- [ ] 图片加载失败时是否有合理 fallback

