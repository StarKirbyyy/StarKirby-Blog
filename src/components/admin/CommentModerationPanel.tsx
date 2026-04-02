"use client";

import { useEffect, useState } from "react";

type AdminComment = {
  id: string;
  postSlug: string;
  content: string;
  status: "visible" | "hidden";
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    status: "active" | "disabled";
  };
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiResponse = {
  comments?: AdminComment[];
  pagination?: Pagination;
  error?: string;
};

function formatDate(value: string) {
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
  status: "all" | "visible" | "hidden";
  postSlug: string;
}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("pageSize", String(params.pageSize));
  if (params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.postSlug.trim()) {
    query.set("postSlug", params.postSlug.trim());
  }
  return query.toString();
}

export function CommentModerationPanel() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [postSlugInput, setPostSlugInput] = useState("");
  const [appliedPostSlug, setAppliedPostSlug] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadComments = async (nextPage: number) => {
    setLoading(true);
    setError("");

    try {
      const query = buildQuery({
        page: nextPage,
        pageSize: 20,
        status: statusFilter,
        postSlug: appliedPostSlug,
      });
      const response = await fetch(`/api/admin/comments?${query}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(json.error || "评论加载失败");
      }

      setComments(json.comments ?? []);
      setPagination(
        json.pagination ?? {
          page: nextPage,
          pageSize: 20,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "评论加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, appliedPostSlug]);

  const onApplyPostSlugFilter = () => {
    setPage(1);
    setAppliedPostSlug(postSlugInput.trim());
  };

  const onChangeStatus = async (commentId: string, nextStatus: "visible" | "hidden") => {
    const key = `status:${commentId}`;
    setActionKey(key);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = (await response.json()) as { comment?: AdminComment; error?: string };
      if (!response.ok || !json.comment) {
        throw new Error(json.error || "状态更新失败");
      }

      setComments((previous) =>
        previous.map((item) => (item.id === commentId ? json.comment! : item)),
      );
      setMessage(nextStatus === "hidden" ? "评论已隐藏" : "评论已恢复显示");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "状态更新失败");
    } finally {
      setActionKey("");
    }
  };

  const onDelete = async (commentId: string) => {
    if (!window.confirm("确认永久删除这条评论？")) {
      return;
    }

    const key = `delete:${commentId}`;
    setActionKey(key);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/comments/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.error || "删除失败");
      }

      setComments((previous) => previous.filter((item) => item.id !== commentId));
      setPagination((previous) => ({
        ...previous,
        total: Math.max(0, previous.total - 1),
      }));
      setMessage("评论已删除");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setActionKey("");
    }
  };

  return (
    <div className="content-shell admin-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel admin-hero-panel rounded-[10px] p-6 sm:p-7">
        <p className="admin-kicker">Admin Workspace</p>
        <h1 className="sakurairo-page-title mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          评论管理
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          管理员可隐藏/恢复评论，也可执行永久删除。所有管理操作会写入审计日志。
        </p>
      </header>

      <section className="glass-panel admin-list-card mt-6 rounded-[10px] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "visible" | "hidden");
              setPage(1);
            }}
            className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          >
            <option value="all">全部状态</option>
            <option value="visible">仅显示中</option>
            <option value="hidden">仅已隐藏</option>
          </select>

          <input
            value={postSlugInput}
            onChange={(event) => setPostSlugInput(event.target.value)}
            className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="按 postSlug 过滤，例如 hello-starkirby-blog"
          />

          <button
            type="button"
            onClick={onApplyPostSlugFilter}
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-hover"
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
          共 {pagination.total} 条评论，当前第 {pagination.page}/{pagination.totalPages} 页
        </p>

        {loading ? (
          <p className="text-sm text-muted-fg">评论加载中...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-fg">当前筛选条件下暂无评论。</p>
        ) : (
          comments.map((comment) => {
            const isStatusUpdating = actionKey === `status:${comment.id}`;
            const isDeleting = actionKey === `delete:${comment.id}`;
            return (
              <article
                key={comment.id}
                className="glass-panel admin-list-card card-hover rounded-[10px] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {comment.user.name ?? "未命名用户"} · {comment.user.email ?? "无邮箱"}
                    </p>
                    <p className="text-xs text-muted-fg">
                      post: {comment.postSlug} · {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1 text-xs text-foreground">
                      {comment.status}
                    </span>
                    <button
                      type="button"
                      disabled={isStatusUpdating || isDeleting}
                      onClick={() =>
                        onChangeStatus(
                          comment.id,
                          comment.status === "visible" ? "hidden" : "visible",
                        )
                      }
                      className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1 text-xs text-muted-fg transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isStatusUpdating
                        ? "处理中..."
                        : comment.status === "visible"
                          ? "隐藏"
                          : "恢复"}
                    </button>
                    <button
                      type="button"
                      disabled={isStatusUpdating || isDeleting}
                      onClick={() => onDelete(comment.id)}
                      className="rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs text-red-700 transition-colors hover:bg-red-500/25 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? "删除中..." : "删除"}
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {comment.content}
                </p>
              </article>
            );
          })
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPage((previous) => Math.max(1, previous - 1))}
          disabled={page <= 1 || loading}
          className="inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-2 text-sm text-muted-fg transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          上一页
        </button>
        <button
          type="button"
          onClick={() => setPage((previous) => Math.min(pagination.totalPages, previous + 1))}
          disabled={page >= pagination.totalPages || loading}
          className="inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-2 text-sm text-muted-fg transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
