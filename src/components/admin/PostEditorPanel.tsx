"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MarkdownLiveEditor } from "@/components/admin/MarkdownLiveEditor";

type EditorPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string | null;
  tags: string[];
  coverUrl: string | null;
  sourceUrl: string;
  readingTime: string;
  draft: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  markdown: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type EditorApiResponse = {
  post?: EditorPost;
  versionToken?: string;
  error?: string;
};

type UpdateResponse = {
  success?: boolean;
  post?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    date: string;
    updated: string | null;
    tags: string[];
    coverUrl: string | null;
    sourceUrl: string;
    readingTime: string;
    draft: boolean;
    publishedAt: string | null;
    updatedAt: string;
  };
  versionToken?: string;
  postUrl?: string;
  conflict?: boolean;
  latest?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    date: string | null;
    updated: string | null;
    draft: boolean;
    updatedAt: string;
  };
  error?: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PostEditorPanel({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<EditorPost | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState("");
  const [updated, setUpdated] = useState("");
  const [tags, setTags] = useState("");
  const [draft, setDraft] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [versionToken, setVersionToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const applyPostToForm = (nextPost: EditorPost) => {
    setPost(nextPost);
    setTitle(nextPost.title);
    setDescription(nextPost.description);
    setSlug(nextPost.slug);
    setDate(nextPost.date);
    setUpdated(nextPost.updated ?? "");
    setTags(nextPost.tags.join(", "));
    setDraft(nextPost.draft);
    setMarkdown(nextPost.markdown);
  };

  const loadPost = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as EditorApiResponse;
      if (!response.ok || !json.post) {
        throw new Error(json.error || "文章加载失败");
      }
      applyPostToForm(json.post);
      setVersionToken(json.versionToken ?? json.post.updatedAt);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "文章加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submitUpdate = async (
    nextDraft: boolean,
    intent: "save_draft" | "publish" | "unpublish",
  ) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          slug,
          date,
          updated: updated || null,
          tags,
          draft: nextDraft,
          markdown,
          expectedUpdatedAt: versionToken,
          intent,
        }),
      });
      const json = (await response.json()) as UpdateResponse;
      if (response.status === 409 && json.conflict) {
        const latestTime = json.latest?.updatedAt
          ? formatDateTime(json.latest.updatedAt)
          : "未知";
        throw new Error(
          `检测到并发冲突：该文章已在 ${latestTime} 被其他会话修改，请点击“刷新最新内容”后再编辑。`,
        );
      }
      if (!response.ok || !json.success || !json.post) {
        throw new Error(json.error || "保存失败");
      }

      setPost((previous) =>
        previous
          ? {
              ...previous,
              ...json.post,
              markdown,
            }
          : null,
      );
      setSlug(json.post.slug);
      setDate(json.post.date);
      setUpdated(json.post.updated ?? "");
      setDraft(json.post.draft);
      setVersionToken(json.versionToken ?? json.post.updatedAt);
      if (intent === "save_draft") {
        setMessage(`草稿已保存：${json.postUrl ?? `/posts/${json.post.slug}`}`);
      } else if (intent === "unpublish") {
        setMessage(`文章已下线：${json.postUrl ?? `/posts/${json.post.slug}`}`);
      } else {
        setMessage(`发布更新成功：${json.postUrl ?? `/posts/${json.post.slug}`}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onUploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}/assets`, {
      method: "POST",
      body: formData,
    });

    const json = (await response.json()) as {
      success?: boolean;
      url?: string;
      markdown?: string;
      alt?: string;
      error?: string;
    };

    if (!response.ok || !json.success || !json.url) {
      throw new Error(json.error || "图片上传失败");
    }

    return {
      url: json.url,
      markdown: json.markdown,
      alt: json.alt,
    };
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm text-muted-fg">正在加载文章...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-sm text-red-700 dark:text-red-300">
          {error || "文章不存在或加载失败。"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          编辑文章
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          M2 版本支持工具栏、快捷键与实时预览，可直接在线编辑并保存到 OSS + 数据库。
        </p>
        <p className="mt-2 text-xs text-muted-fg">
          创建时间：{formatDateTime(post.createdAt)} · 最近更新：{formatDateTime(post.updatedAt)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/admin/posts"
            className="rounded-md bg-muted px-2 py-1 text-foreground transition-colors hover:bg-muted/80"
          >
            返回文章管理
          </Link>
          <Link
            href={`/posts/${post.slug}`}
            target="_blank"
            className="rounded-md bg-muted px-2 py-1 text-foreground transition-colors hover:bg-muted/80"
          >
            预览当前文章
          </Link>
        </div>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submitUpdate(draft, draft ? "save_draft" : "publish");
        }}
        className="mt-6 space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">标题</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Slug</span>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">描述</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">发布日期</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">更新时间（可选）</span>
            <input
              type="date"
              value={updated}
              onChange={(event) => setUpdated(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>

          <div className="flex items-center self-end rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
            当前状态：{draft ? "草稿" : "已发布"}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">标签（逗号分隔）</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="Next.js,TypeScript,AI"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">
            Markdown 正文（Typora 风格增强）
          </span>
          <MarkdownLiveEditor
            value={markdown}
            onChange={setMarkdown}
            onUploadImage={onUploadImage}
            disabled={saving}
          />
        </div>

        {message ? (
          <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void submitUpdate(true, "save_draft");
            }}
            className="inline-flex rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "处理中..." : "保存草稿"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void submitUpdate(false, "publish");
            }}
            className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "处理中..." : "发布更新"}
          </button>
          <button
            type="button"
            disabled={saving || draft}
            onClick={() => {
              void submitUpdate(true, "unpublish");
            }}
            className="inline-flex rounded-md bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/25 dark:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "处理中..." : "下线文章"}
          </button>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => {
              void loadPost();
            }}
            className="inline-flex rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            刷新最新内容
          </button>
        </div>
      </form>
    </div>
  );
}
