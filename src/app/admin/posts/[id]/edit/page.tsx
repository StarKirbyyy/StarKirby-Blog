import type { Metadata } from "next";
import { PostEditorPanel } from "@/components/admin/PostEditorPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "编辑文章",
  description: "后台在线编辑文章内容与元数据。",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPostEditPage({ params }: PageProps) {
  const { id } = await params;
  return <PostEditorPanel postId={id} />;
}
