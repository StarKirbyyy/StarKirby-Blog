import type { Metadata } from "next";
import { CommentModerationPanel } from "@/components/admin/CommentModerationPanel";

export const metadata: Metadata = {
  title: "评论管理",
  description: "管理员评论审核与删除后台。",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/admin/comments",
  },
};

export default function AdminCommentsPage() {
  return <CommentModerationPanel />;
}
