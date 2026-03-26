import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/auth/ProfileSettingsForm";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "个人资料",
  description: "管理你的账号资料信息。",
  alternates: {
    canonical: "/settings/profile",
  },
};

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fsettings%2Fprofile");
  }

  if (session.user.status === "disabled") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">
          当前账号已被禁用，请联系管理员处理。
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="text-sm text-muted-fg transition-colors hover:text-accent"
      >
        ← 返回首页
      </Link>
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          个人资料设置
        </h1>
        <p className="mt-2 text-sm text-muted-fg">
          你可以更新昵称、头像、简介和个人网站。
        </p>
      </header>

      <ProfileSettingsForm />
    </div>
  );
}
