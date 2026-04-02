"use client";

import { useState } from "react";

type NewsletterSignupCardProps = {
  className?: string;
  source?: string;
};

export function NewsletterSignupCard({
  className = "",
  source = "site",
}: NewsletterSignupCardProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("请输入邮箱地址。");
      return;
    }

    setStatus("loading");
    setMessage("正在提交订阅...");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmed,
          source,
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string; message?: string };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "订阅失败");
      }

      setStatus("success");
      setMessage(payload.message || "订阅成功，感谢关注。");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "订阅失败，请稍后重试。");
    }
  };

  return (
    <section className={`glass-panel rounded-[10px] p-5 sm:p-6 ${className}`.trim()}>
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Newsletter 订阅</h2>
      <p className="mt-2 text-sm leading-6 text-muted-fg">
        输入邮箱即可在新文章发布后收到通知（当前为订阅收集阶段）。
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          className="w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2 sm:flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "提交中..." : "订阅"}
        </button>
      </form>

      {status !== "idle" ? (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
