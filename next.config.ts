import type { NextConfig } from "next";

const ossPublicHost = process.env.NEXT_PUBLIC_OSS_PUBLIC_HOST?.trim();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.aliyuncs.com",
      },
      ...(ossPublicHost
        ? [
            {
              protocol: "https" as const,
              hostname: ossPublicHost,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
