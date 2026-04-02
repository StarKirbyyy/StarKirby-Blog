import type { Metadata } from "next";
import { NewsletterManagementPanel } from "@/components/admin/NewsletterManagementPanel";

export const metadata: Metadata = {
  title: "Newsletter 管理",
  description: "管理员查看与管理 Newsletter 订阅列表。",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/newsletter",
  },
};

export default function AdminNewsletterPage() {
  return <NewsletterManagementPanel />;
}
