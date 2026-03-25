"use client";

import { useState } from "react";

type PublishResult = {
  success: boolean;
  slug: string;
  postPath: string;
  coverPath: string | null;
  postUrl: string;
};

export function PublishForm() {
  const [apiKey, setApiKey] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PublishResult | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("apiKey", apiKey);
    formData.set("slug", slug);

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
      setMessage("发布成功，仓库已写入新内容。");
      setResult(json);
      form.reset();
      setSlug("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "发布失败");
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          在线发布文章
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          上传 `.md/.mdx` 文件并可选封面图，系统会自动提交到 GitHub 仓库并触发部署。
        </p>
      </header>

      <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">发布密钥（PUBLISH_API_KEY）</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-fg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">封面图（可选）</span>
          <input
            name="coverFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-fg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">自定义 slug（可选）</span>
          <input
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="不填则根据文件名自动生成"
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "发布中..." : "发布文章"}
        </button>
      </form>

      {status !== "idle" ? (
        <div
          className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
            status === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
              : status === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                : "border-border bg-card text-muted-fg"
          }`}
        >
          <p>{message}</p>
          {result ? (
            <div className="mt-2 space-y-1 text-xs">
              <p>slug: {result.slug}</p>
              <p>postPath: {result.postPath}</p>
              {result.coverPath ? <p>coverPath: public{result.coverPath}</p> : null}
              <p>postUrl: {result.postUrl}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
