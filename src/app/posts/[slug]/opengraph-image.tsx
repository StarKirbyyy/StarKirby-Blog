import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getPostBySlug } from "@/lib/posts";

interface PostOgImageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function decodeSlugParam(slug: string) {
  const raw = slug.trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function PostOpenGraphImage({ params }: PostOgImageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(decodeSlugParam(slug));

  const title = post?.title ?? siteConfig.title;
  const description = post?.description ?? siteConfig.description;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(145deg, #0b1024 0%, #1e293b 45%, #0284c7 100%)",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            opacity: 0.9,
          }}
        >
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.08,
              maxWidth: 1020,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              opacity: 0.9,
              maxWidth: 1020,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
