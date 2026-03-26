import { Prisma } from "@prisma/client";

export const COMMENT_MAX_LENGTH = 1000;
export const COMMENT_RATE_LIMIT_WINDOW_MS = 60_000;
export const COMMENT_RATE_LIMIT_MAX_COUNT = Number.parseInt(
  process.env.COMMENT_POST_LIMIT_PER_MINUTE ?? "5",
  10,
);

export function normalizePostSlug(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^\/+|\/+$/g, "");
}

export function normalizeContent(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeCommentStatus(value: unknown) {
  if (value === "visible" || value === "hidden") {
    return value;
  }
  return null;
}

export function safePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export const commentPublicSelect = Prisma.validator<Prisma.CommentSelect>()({
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
});

export const commentAdminSelect = Prisma.validator<Prisma.CommentSelect>()({
  id: true,
  postSlug: true,
  content: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      status: true,
    },
  },
});
