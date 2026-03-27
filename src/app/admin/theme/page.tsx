import type { Metadata } from "next";
import { ThemeSettingsPanel } from "@/components/admin/ThemeSettingsPanel";

export const metadata: Metadata = {
  title: "主题设置",
  description: "管理员配置站点级 Sakurairo 默认主题。",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/theme",
  },
};

export default function AdminThemePage() {
  return <ThemeSettingsPanel />;
}
