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
    <div className="content-shell pb-10 pt-5 sm:pt-7">
      <LoginPanel />
    </div>
  );
}
