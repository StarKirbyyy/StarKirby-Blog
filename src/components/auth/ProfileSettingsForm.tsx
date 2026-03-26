"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  bio: string | null;
  website: string | null;
  role: "user" | "admin";
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  image: string;
  bio: string;
  website: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export function ProfileSettingsForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    image: "",
    bio: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/user/profile", {
          cache: "no-store",
        });
        const json = (await response.json()) as { user?: Profile; error?: string };

        if (!response.ok || !json.user) {
          throw new Error(json.error || "读取个人资料失败");
        }

        setProfile(json.user);
        setForm({
          name: json.user.name ?? "",
          image: json.user.image ?? "",
          bio: json.user.bio ?? "",
          website: json.user.website ?? "",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "读取个人资料失败");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as { user?: Profile; error?: string };
      if (!response.ok || !json.user) {
        throw new Error(json.error || "保存失败");
      }

      setProfile(json.user);
      setForm({
        name: json.user.name ?? "",
        image: json.user.image ?? "",
        bio: json.user.bio ?? "",
        website: json.user.website ?? "",
      });
      setMessage("资料已保存");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const onChange = (key: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm text-muted-fg">正在加载个人资料...</p>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">
        {error}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-fg">
        <span className="rounded bg-muted px-2 py-1">role: {profile?.role ?? "user"}</span>
        <span className="rounded bg-muted px-2 py-1">status: {profile?.status ?? "active"}</span>
        <span className="rounded bg-muted px-2 py-1">
          创建于 {profile?.createdAt ? formatDate(profile.createdAt) : "-"}
        </span>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">邮箱（只读）</span>
          <input
            type="text"
            value={profile?.email ?? ""}
            disabled
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-fg"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">昵称</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="2~30 个字符"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">头像 URL</span>
          <input
            type="url"
            value={form.image}
            onChange={(event) => onChange("image", event.target.value)}
            placeholder="https://example.com/avatar.png"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">个人网站</span>
          <input
            type="url"
            value={form.website}
            onChange={(event) => onChange("website", event.target.value)}
            placeholder="https://starkirby.top"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">个人简介</span>
          <textarea
            value={form.bio}
            onChange={(event) => onChange("bio", event.target.value)}
            rows={4}
            placeholder="一句话介绍你自己（最多 280 字）"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存资料"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 text-sm text-green-700 dark:text-green-300">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}
    </section>
  );
}
