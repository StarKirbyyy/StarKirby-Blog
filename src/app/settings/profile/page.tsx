import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/auth/ProfileSettingsForm";
import { siteConfig } from "@/config/site";
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
      <div className="content-shell pb-10 pt-5 sm:pt-7">
        <section className="glass-panel rounded-[10px] border-red-500/35 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">
          当前账号已被禁用，请联系管理员处理。
        </section>
      </div>
    );
  }

  return (
    <div className="content-shell space-y-5 pb-10 pt-5 sm:pt-7">
      <header className="glass-panel rounded-[10px] p-6 sm:p-7">
        <Link
          href="/"
          className="inline-flex rounded-full border border-border/70 bg-surface-soft px-3 py-1.5 text-sm text-muted-fg transition-colors hover:text-foreground"
        >
          ← 返回首页
        </Link>
        <h1
          className={`${siteConfig.sakurairo.pageTitleAnimation ? "sakurairo-page-title " : ""}mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl`}
          style={{
            ["--sakurairo-title-duration" as string]: `${siteConfig.sakurairo.pageTitleAnimationDuration}s`,
          }}
        >
          个人资料设置
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-fg">你可以更新昵称、头像、简介和个人网站。</p>
      </header>

      <ProfileSettingsForm />
    </div>
  );
}
