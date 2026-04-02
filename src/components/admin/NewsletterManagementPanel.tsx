"use client";

import { useEffect, useState } from "react";

type Subscriber = {
  id: string;
  email: string;
  status: "active" | "unsubscribed";
  source: string | null;
  subscribedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ApiResponse = {
  subscribers?: Subscriber[];
  pagination?: Pagination;
  stats?: {
    activeTotal: number;
    unsubscribedTotal: number;
  };
  error?: string;
};

type Campaign = {
  id: string;
  subject: string;
  provider: string;
  segmentTags: string[];
  status: "queued" | "partial" | "sent" | "failed";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  senderEmail: string;
  replyToEmail: string | null;
  errorSummary: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type CampaignResponse = {
  campaigns?: Campaign[];
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

function buildQuery(params: {
  page: number;
  pageSize: number;
  status: "all" | "active" | "unsubscribed";
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

export function NewsletterManagementPanel() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [unsubscribedTotal, setUnsubscribedTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [subjectInput, setSubjectInput] = useState("");
  const [bodyInput, setBodyInput] = useState("");
  const [testEmailInput, setTestEmailInput] = useState("");
  const [segmentTagsInput, setSegmentTagsInput] = useState("");
  const [scheduledAtInput, setScheduledAtInput] = useState("");
  const [templateTagInput, setTemplateTagInput] = useState("");
  const [templateLimitInput, setTemplateLimitInput] = useState("5");
  const [dryRun, setDryRun] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendMessage, setSendMessage] = useState("");

  const loadSubscribers = async (nextPage: number) => {
    setLoading(true);
    setError("");

    try {
      const query = buildQuery({
        page: nextPage,
        pageSize: 20,
        status: statusFilter,
        q: appliedSearch,
      });
      const response = await fetch(`/api/admin/newsletter?${query}`, { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(payload.error || "订阅列表加载失败");
      }
      setSubscribers(payload.subscribers ?? []);
      setActiveTotal(payload.stats?.activeTotal ?? 0);
      setUnsubscribedTotal(payload.stats?.unsubscribedTotal ?? 0);
      setPagination(
        payload.pagination ?? {
          page: nextPage,
          pageSize: 20,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "订阅列表加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const response = await fetch("/api/admin/newsletter/campaigns?page=1&pageSize=8", {
        cache: "no-store",
      });
      const payload = (await response.json()) as CampaignResponse;
      if (!response.ok) {
        throw new Error(payload.error || "发送记录加载失败");
      }
      setCampaigns(payload.campaigns ?? []);
    } catch (campaignError) {
      setSendError(
        campaignError instanceof Error ? campaignError.message : "发送记录加载失败",
      );
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    void loadSubscribers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, appliedSearch]);

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const onApplySearch = () => {
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const onToggleStatus = async (subscriber: Subscriber) => {
    const nextStatus = subscriber.status === "active" ? "unsubscribed" : "active";
    setUpdatingId(subscriber.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/newsletter/${encodeURIComponent(subscriber.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json()) as { subscriber?: Subscriber; error?: string };
      if (!response.ok || !payload.subscriber) {
        throw new Error(payload.error || "状态更新失败");
      }

      setSubscribers((previous) =>
        previous.map((item) => (item.id === subscriber.id ? payload.subscriber! : item)),
      );
      setMessage(nextStatus === "active" ? "订阅已恢复" : "订阅已停用");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "状态更新失败");
    } finally {
      setUpdatingId(null);
    }
  };

  const onSendCampaign = async () => {
    setSendError("");
    setSendMessage("");
    setSending(true);
    try {
      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subjectInput,
          bodyText: bodyInput,
          testEmail: testEmailInput.trim() || undefined,
          segmentTags: segmentTagsInput.trim() || undefined,
          scheduledAt: scheduledAtInput.trim() || undefined,
          dryRun,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        campaignId?: string;
        status?: string;
        totalRecipients?: number;
        sentCount?: number;
        failedCount?: number;
        errorSummary?: string | null;
        dryRun?: boolean;
        scheduled?: boolean;
        scheduledAt?: string;
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "发送失败");
      }
      if (payload.scheduled) {
        setSendMessage(
          `已创建定时任务：计划于 ${payload.scheduledAt ?? "指定时间"} 发送，预计收件人数 ${payload.totalRecipients ?? 0}。`,
        );
      } else {
        const dryRunLabel = payload.dryRun ? "（Dry Run）" : "";
        setSendMessage(
          `发送完成${dryRunLabel}：总计 ${payload.totalRecipients ?? 0}，成功 ${payload.sentCount ?? 0}，失败 ${payload.failedCount ?? 0}。`,
        );
      }
      if (!payload.dryRun) {
        setTestEmailInput("");
      }
      await loadCampaigns();
      await loadSubscribers(page);
    } catch (campaignError) {
      setSendError(campaignError instanceof Error ? campaignError.message : "发送失败");
    } finally {
      setSending(false);
    }
  };

  const onGenerateLatestTemplate = async () => {
    setSendError("");
    setSendMessage("");
    try {
      const params = new URLSearchParams();
      const limit = Number.parseInt(templateLimitInput, 10);
      if (Number.isFinite(limit) && limit > 0) {
        params.set("limit", String(limit));
      }
      if (templateTagInput.trim()) {
        params.set("tags", templateTagInput.trim());
      }
      const response = await fetch(
        `/api/admin/newsletter/template/latest-posts?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as {
        success?: boolean;
        subject?: string;
        bodyText?: string;
        error?: string;
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "模板生成失败");
      }
      setSubjectInput(payload.subject ?? "");
      setBodyInput(payload.bodyText ?? "");
      setSegmentTagsInput(templateTagInput.trim());
      setSendMessage("已生成最新文章模板，可继续编辑后发送。");
    } catch (templateError) {
      setSendError(templateError instanceof Error ? templateError.message : "模板生成失败");
    }
  };

  return (
    <div className="content-shell admin-shell pb-10 pt-5 sm:pt-7">
      <header className="glass-panel admin-hero-panel rounded-[10px] p-6 sm:p-7">
        <p className="admin-kicker">Admin Workspace</p>
        <h1 className="sakurairo-page-title mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Newsletter 管理
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-fg">
          管理站内订阅邮箱，支持筛选与订阅状态切换。
        </p>
        <p className="mt-2 text-xs text-muted-fg">
          当前活跃订阅：{activeTotal} · 已停用：{unsubscribedTotal}
        </p>
      </header>

      <section className="glass-panel admin-list-card mt-6 rounded-[10px] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">发送 Newsletter</h2>
        <p className="mt-2 text-sm text-muted-fg">
          支持群发给所有活跃订阅，也支持填写测试邮箱进行单发校验。
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto] sm:items-center">
            <input
              value={templateTagInput}
              onChange={(event) => setTemplateTagInput(event.target.value)}
              placeholder="模板标签过滤（可选，逗号分隔）"
              className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
            <input
              value={templateLimitInput}
              onChange={(event) => setTemplateLimitInput(event.target.value)}
              placeholder="条数"
              className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
            <button
              type="button"
              onClick={onGenerateLatestTemplate}
              className="inline-flex rounded-full border border-border/70 bg-surface-soft px-4 py-2 text-sm text-muted-fg transition-colors hover:text-foreground"
            >
              生成最新文章模板
            </button>
          </div>
          <label className="block text-sm text-muted-fg">
            邮件主题
            <input
              value={subjectInput}
              onChange={(event) => setSubjectInput(event.target.value)}
              placeholder="例如：StarKirby Blog 本周更新"
              className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>
          <label className="block text-sm text-muted-fg">
            正文（纯文本，系统会自动转成 HTML）
            <textarea
              rows={8}
              value={bodyInput}
              onChange={(event) => setBodyInput(event.target.value)}
              placeholder="输入邮件正文"
              className="mt-1 w-full rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={segmentTagsInput}
              onChange={(event) => setSegmentTagsInput(event.target.value)}
              placeholder="活动标签（可选，逗号分隔，如：前端,AI）"
              className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
            <input
              type="datetime-local"
              value={scheduledAtInput}
              onChange={(event) => setScheduledAtInput(event.target.value)}
              className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <input
              value={testEmailInput}
              onChange={(event) => setTestEmailInput(event.target.value)}
              placeholder="测试邮箱（留空=群发活跃订阅）"
              className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            />
            <label className="inline-flex items-center gap-2 text-sm text-muted-fg">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
              />
              Dry Run
            </label>
            <button
              type="button"
              onClick={onSendCampaign}
              disabled={sending}
              className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "发送中..." : "开始发送"}
            </button>
          </div>
        </div>

        {sendMessage ? (
          <p className="mt-3 text-sm text-green-700 dark:text-green-300">{sendMessage}</p>
        ) : null}
        {sendError ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{sendError}</p> : null}
      </section>

      <section className="glass-panel admin-list-card mt-6 rounded-[10px] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | "active" | "unsubscribed");
              setPage(1);
            }}
            className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          >
            <option value="all">全部状态</option>
            <option value="active">仅订阅中</option>
            <option value="unsubscribed">仅已停用</option>
          </select>

          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="rounded-[10px] border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
            placeholder="搜索邮箱关键词"
          />

          <button
            type="button"
            onClick={onApplySearch}
            className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-[var(--shadow-soft)] transition-colors hover:bg-accent-hover"
          >
            应用过滤
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-green-700 dark:text-green-300">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-base font-semibold text-foreground">最近发送记录</h2>
        {loadingCampaigns ? (
          <p className="text-sm text-muted-fg">发送记录加载中...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-fg">暂无发送记录。</p>
        ) : (
          campaigns.map((campaign) => (
            <article key={campaign.id} className="glass-panel admin-list-card rounded-[10px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{campaign.subject}</p>
                  <p className="mt-1 text-xs text-muted-fg">
                    {campaign.provider} · {formatDateTime(campaign.createdAt)} ·
                    {` ${campaign.createdByUser?.name ?? campaign.createdByUser?.email ?? "系统"}`}
                  </p>
                  {campaign.segmentTags.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-fg">
                      活动标签：{campaign.segmentTags.join("、")}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-fg">
                    发件人: {campaign.senderEmail}
                    {campaign.replyToEmail ? ` · Reply-To: ${campaign.replyToEmail}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">
                    计划发送: {formatDateTime(campaign.scheduledAt)} · 开始发送:{" "}
                    {formatDateTime(campaign.startedAt)} · 完成: {formatDateTime(campaign.completedAt)}
                  </p>
                  {campaign.errorSummary ? (
                    <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                      错误摘要：{campaign.errorSummary}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-muted-fg">
                  <p>状态：{campaign.status}</p>
                  <p className="mt-1">
                    总计 {campaign.totalRecipients} · 成功 {campaign.sentCount} · 失败 {campaign.failedCount}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="mt-6 space-y-3">
        <p className="text-sm text-muted-fg">
          共 {pagination.total} 条订阅，当前第 {pagination.page}/{pagination.totalPages} 页
        </p>

        {loading ? (
          <p className="text-sm text-muted-fg">订阅列表加载中...</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-muted-fg">当前筛选条件下暂无订阅。</p>
        ) : (
          subscribers.map((subscriber) => (
            <article key={subscriber.id} className="glass-panel admin-list-card card-hover rounded-[10px] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{subscriber.email}</p>
                  <p className="mt-1 text-xs text-muted-fg">
                    来源: {subscriber.source || "site"} · 订阅时间: {formatDateTime(subscriber.subscribedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-fg">
                    停用时间: {formatDateTime(subscriber.unsubscribedAt)} · 最近更新: {formatDateTime(subscriber.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1 text-xs text-foreground">
                    {subscriber.status}
                  </span>
                  <button
                    type="button"
                    disabled={updatingId === subscriber.id}
                    onClick={() => onToggleStatus(subscriber)}
                    className="rounded-full border border-border/70 bg-surface-soft px-2.5 py-1 text-xs text-muted-fg transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingId === subscriber.id
                      ? "处理中..."
                      : subscriber.status === "active"
                        ? "停用订阅"
                        : "恢复订阅"}
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
