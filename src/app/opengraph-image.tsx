import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} Open Graph Image`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
            "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0ea5e9 100%)",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            fontSize: 34,
            opacity: 0.9,
          }}
        >
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.08,
              maxWidth: 980,
            }}
          >
            {siteConfig.title}
          </div>
          <div
            style={{
              fontSize: 34,
              opacity: 0.92,
              maxWidth: 980,
            }}
          >
            {siteConfig.description}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
