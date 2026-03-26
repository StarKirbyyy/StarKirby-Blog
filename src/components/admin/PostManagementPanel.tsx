"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AdminPost = {
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
  author: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiResponse = {
  posts?: AdminPost[];
  pagination?: Pagination;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildQuery(params: {
  page: number;
  pageSize: number;
  status: "all" | "published" | "draft";
  q: string;
}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));
  if (params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.q.trim()) {
    query.set("q", params.q.trim());
  }
  return query.toString();
}

export function PostManagementPanel() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPosts = async (nextPage: number) => {
    setLoading(true);
    setError("");

    try {
      const query = buildQuery({
        page: nextPage,
        pageSize: 20,
        status: statusFilter,
        q: appliedSearch,
      });
      const response = await fetch(`/api/admin/posts?${query}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(json.error || "文章加载失败");
      }

      setPosts(json.posts ?? []);
      setPagination(
        json.pagination ?? {
          page: nextPage,
          pageSize: 20,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "文章加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, appliedSearch]);

  const onApplySearch = () => {
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const onDelete = async (post: AdminPost) => {
    if (!window.confirm(`确认删除文章「${post.title}」？此操作不可恢复。`)) {
      return;
    }

    setDeletingPostId(post.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/posts/${encodeURIComponent(post.id)}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { success?: boolean; error?: string; deletedComments?: number };
      if (!response.ok || !json.success) {
        throw new Error(json.error || "删除失败");
      }

      setPosts((previous) => previous.filter((item) => item.id !== post.id));
      setPagination((previous) => ({
        ...previous,
        total: Math.max(0, previous.total - 1),
      }));
      setMessage(`文章已删除，同时清理 ${json.deletedComments ?? 0} 条评论。`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          文章管理
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          查看云端文章，支持筛选、编辑与删除。删除会同步移除该文章关联评论，并记录审计日志。
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "published" | "draft");
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          >
            <option value="all">全部状态</option>
            <option value="published">仅已发布</option>
            <option value="draft">仅草稿</option>
          </select>

          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="搜索标题/slug/描述"
          />

          <button
            type="button"
            onClick={onApplySearch}
            className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
          >
            应用过滤
          </button>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-green-700 dark:text-green-300">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : null}
      </section>

      <section className="mt-6 space-y-3">
        <p className="text-sm text-muted-fg">
          共 {pagination.total} 篇，当前第 {pagination.page}/{pagination.totalPages} 页
        </p>

        {loading ? (
          <p className="text-sm text-muted-fg">文章加载中...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-fg">当前筛选条件下暂无文章。</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-fg">
                    slug: {post.slug} · {post.readingTime}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">
                    发布日期: {formatDate(post.date)} · 最近更新: {formatDate(post.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">
                    状态: {post.draft ? "draft" : "published"} · 发布时间: {formatDate(post.publishedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">
                    作者: {post.author?.name ?? "未知"} / {post.author?.email ?? "无邮箱"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-fg">{post.description}</p>
                  {post.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={`${post.id}-${tag}`} className="rounded bg-muted px-2 py-1 text-xs text-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="rounded-md bg-accent/15 px-2 py-1 text-xs text-accent transition-colors hover:bg-accent/25"
                  >
                    编辑
                  </Link>
                  <Link
                    href={`/posts/${post.slug}`}
                    target="_blank"
                    className="rounded-md bg-muted px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted/80"
                  >
                    查看
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(post)}
                    disabled={deletingPostId === post.id}
                    className="rounded-md bg-red-500/15 px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-500/25 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingPostId === post.id ? "删除中..." : "删除"}
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPage((previous) => Math.max(1, previous - 1))}
          disabled={page <= 1 || loading}
          className="inline-flex rounded-md bg-muted px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          上一页
        </button>
        <button
          type="button"
          onClick={() => setPage((previous) => Math.min(pagination.totalPages, previous + 1))}
          disabled={page >= pagination.totalPages || loading}
          className="inline-flex rounded-md bg-muted px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
