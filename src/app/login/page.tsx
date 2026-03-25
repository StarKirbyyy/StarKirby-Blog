import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/LoginPanel";

export const metadata: Metadata = {
  title: "登录",
  description: "使用 GitHub 账号登录 StarKirby Blog。",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <LoginPanel />
    </div>
  );
}
