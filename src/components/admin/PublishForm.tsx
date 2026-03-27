"use client";

import { useState } from "react";

type PublishResult = {
  success: boolean;
  mode: "created" | "updated";
  slug: string;
  postId: string;
  sourceUrl: string;
  coverUrl: string | null;
  postUrl: string;
};

function stripFrontmatter(source: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return normalized;
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return normalized;
  }
  return normalized.slice(end + 5);
}

function extractTitleFromMarkdown(source: string) {
  const content = stripFrontmatter(source);
  const lines = content.split(/\r?\n/);
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) {
      continue;
    }
    const matched = line.match(/^#\s+(.+?)\s*$/);
    if (matched) {
      return matched[1].trim();
    }
  }

  return "";
}

export function PublishForm() {
  const [apiKey, setApiKey] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PublishResult | null>(null);

  const onPostFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    const source = await file.text();
    const headingTitle = extractTitleFromMarkdown(source);
    if (headingTitle) {
      setTitle(headingTitle);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("apiKey", apiKey);
    formData.set("slug", slug);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("tags", tags);
    formData.set("date", date);

    setStatus("loading");
    setMessage("正在发布文章...");
    setResult(null);

    try {
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as PublishResult & { error?: string };

      if (!response.ok) {
        throw new Error(json.error || "发布失败");
      }

      setStatus("success");
      setMessage("发布成功，内容已写入 OSS 与数据库。");
      setResult(json);
      form.reset();
      setSlug("");
      setTitle("");
      setDescription("");
      setTags("");
      setDate("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "发布失败");
    }
  };

  return (
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          在线发布文章
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          上传 `.md/.mdx` 文件并可选封面图，系统会自动上传到 OSS 并写入数据库。
        </p>
        <p className="mt-2 text-xs text-muted-fg">
          若文件缺少 frontmatter，系统会根据你填写的字段自动补全；`title` 默认读取 Markdown 一级标题。
        </p>
      </header>

      <form onSubmit={onSubmit} className="glass-panel mt-6 space-y-5 rounded-[10px] p-5 sm:p-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">发布密钥（PUBLISH_API_KEY）</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            required
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="输入发布密钥"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Markdown 文件（必填）</span>
          <input
            name="postFile"
            type="file"
            accept=".md,.mdx,text/markdown"
            required
            onChange={onPostFileChange}
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-muted-fg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">标题（可编辑）</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="默认读取 Markdown 一级标题"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">描述（可选）</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="不填将自动使用正文首段作为摘要"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">标签（可选）</span>
          <input
            name="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="多个标签用逗号分隔，如：Next.js,TypeScript,AI"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">发布日期（可选）</span>
          <input
            name="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
          <p className="text-xs text-muted-fg">不选择则默认使用系统日期（YYYY-MM-DD）。</p>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">封面图（可选）</span>
          <input
            name="coverFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-muted-fg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">自定义 slug（可选）</span>
          <input
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="不填则根据文件名自动生成"
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "发布中..." : "发布文章"}
        </button>
      </form>

      {status !== "idle" ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            status === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
              : status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                : "border-border bg-surface-soft text-muted-fg"
          }`}
        >
          <p>{message}</p>
          {result ? (
            <div className="mt-2 space-y-1 text-xs">
              <p>mode: {result.mode}</p>
              <p>slug: {result.slug}</p>
              <p>postId: {result.postId}</p>
              <p>sourceUrl: {result.sourceUrl}</p>
              {result.coverUrl ? <p>coverUrl: {result.coverUrl}</p> : null}
              <p>postUrl: {result.postUrl}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
