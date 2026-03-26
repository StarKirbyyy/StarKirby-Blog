import type { Metadata } from "next";
import { PostManagementPanel } from "@/components/admin/PostManagementPanel";

export const metadata: Metadata = {
  title: "文章管理",
  description: "后台文章列表与删除管理。",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/posts",
  },
};

export default function AdminPostsPage() {
  return <PostManagementPanel />;
}
