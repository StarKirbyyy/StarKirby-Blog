"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SessionProvider, signIn, useSession } from "next-auth/react";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

interface LocalCommentsProps {
  postSlug: string;
}

const COMMENT_MAX_LENGTH = 1000;

function formatDate(input: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(input));
}

function LocalCommentsInner({ postSlug }: LocalCommentsProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/comments?postSlug=${encodeURIComponent(postSlug)}`,
          { cache: "no-store" },
        );
        const json = (await response.json()) as {
          comments?: CommentItem[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(json.error || "评论加载失败");
        }

        setComments(json.comments ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "评论加载失败");
      } finally {
        setLoading(false);
      }
    };

    void loadComments();
  }, [postSlug]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postSlug,
          content,
        }),
      });
      const json = (await response.json()) as {
        comment?: CommentItem;
        error?: string;
      };

      if (!response.ok || !json.comment) {
        throw new Error(json.error || "评论发布失败");
      }

      setComments((previous) => [...previous, json.comment!]);
      setContent("");
      setMessage("评论发布成功");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "评论发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteComment = async (commentId: string) => {
    if (!window.confirm("确认删除这条评论？删除后不可恢复。")) {
      return;
    }

    setDeletingCommentId(commentId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !json.success) {
        throw new Error(json.error || "删除失败");
      }

      setComments((previous) => previous.filter((item) => item.id !== commentId));
      setMessage("评论已删除");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isSignedIn = Boolean(session?.user);
  const isDisabled = session?.user?.status === "disabled";

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        评论
      </h2>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        {status === "loading" ? (
          <p className="text-sm text-muted-fg">正在检查登录状态...</p>
        ) : !isSignedIn ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-fg">登录后可发表评论。</p>
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: `/posts/${postSlug}` })}
              className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              使用 GitHub 登录后评论
            </button>
          </div>
        ) : isDisabled ? (
          <p className="text-sm text-red-700 dark:text-red-300">
            你的账号已被禁用，无法发表评论。
          </p>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="写下你的评论（最多 1000 字）"
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
              required
              maxLength={COMMENT_MAX_LENGTH}
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "发布中..." : "发布评论"}
            </button>
          </form>
        )}

        {message ? (
          <p className="mt-3 text-sm text-green-700 dark:text-green-300">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <p className="text-sm text-muted-fg">
          共 {comments.length} 条评论
        </p>

        {loading ? (
          <p className="text-sm text-muted-fg">评论加载中...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-fg">暂时还没有评论，欢迎抢沙发。</p>
        ) : (
          comments.map((comment) => {
            const avatarSrc = comment.user.image ?? "";
            const canDeleteComment =
              session?.user?.id === comment.user.id || session?.user?.role === "admin";
            return (
              <article
                key={comment.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarSrc}
                        alt={comment.user.name ?? "用户头像"}
                        width={36}
                        height={36}
                        className="rounded-full border border-border"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-foreground">
                        {(comment.user.name ?? "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {comment.user.name ?? "匿名用户"}
                      </p>
                      <p className="text-xs text-muted-fg">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  {canDeleteComment ? (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      className="rounded-md px-2 py-1 text-xs text-muted-fg transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingCommentId === comment.id ? "删除中..." : "删除"}
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {comment.content}
                </p>
              </article>
            );
          })
        )}
      </div>

      <p className="mt-4 text-xs text-muted-fg">
        你可以在 <Link href="/settings/profile" className="underline underline-offset-2">个人资料</Link> 页面更新昵称与头像。
      </p>
    </section>
  );
}

export function LocalComments(props: LocalCommentsProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <LocalCommentsInner {...props} />
    </SessionProvider>
  );
}
