import type { Metadata } from "next";
import { PublishForm } from "@/components/admin/PublishForm";

export const metadata: Metadata = {
  title: "发布后台",
  description: "上传 Markdown 与封面图，在线发布文章。",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/publish",
  },
};

export default function AdminPublishPage() {
  return <PublishForm />;
}
