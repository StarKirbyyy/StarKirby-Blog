import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { downloadTextFromOss, tryGetOssObjectKeyFromUrl } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "posts");
const SUPPORTED_EXTENSIONS = new Set([".mdx", ".md"]);
const POST_CONTENT_REVALIDATE_SECONDS = 3600;
const DATABASE_UNAVAILABLE_COOLDOWN_MS = 30_000;

let skipDatabaseReadsUntil = 0;

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags?: string[];
  cover?: string;
  draft?: boolean;
  slug?: string;
}

export interface PostMeta extends Omit<PostFrontmatter, "slug"> {
  slug: string;
  readingTime: string;
  viewCount?: number;
  commentCount?: number;
  wordCount?: number;
}

export interface Post extends PostMeta {
  content: string;
}

export interface TagCount {
  tag: string;
  count: number;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isDatabaseContentSource() {
  return (process.env.CONTENT_SOURCE ?? "").trim().toLowerCase() === "database";
}

function allowFileFallback() {
  return (process.env.CONTENT_SOURCE_FALLBACK ?? "true").trim() !== "false";
}

function isRetryablePrismaClosedConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Error in PostgreSQL connection/i.test(message) ||
    /kind:\s*Closed/i.test(message) ||
    /Can't reach database server/i.test(message) ||
    /Connection terminated/i.test(message)
  );
}

function isMissingViewCountColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Post\.viewCount/i.test(message) && /does not exist/i.test(message);
}

async function withPrismaReadRetry<T>(query: () => Promise<T>) {
  try {
    const result = await query();
    skipDatabaseReadsUntil = 0;
    return result;
  } catch (error) {
    if (!isRetryablePrismaClosedConnectionError(error)) {
      throw error;
    }
    skipDatabaseReadsUntil = Date.now() + DATABASE_UNAVAILABLE_COOLDOWN_MS;
    try {
      await prisma.$disconnect();
    } catch {
      // ignore disconnect errors
    }
    try {
      const result = await query();
      skipDatabaseReadsUntil = 0;
      return result;
    } catch (retryError) {
      skipDatabaseReadsUntil = Date.now() + DATABASE_UNAVAILABLE_COOLDOWN_MS;
      throw retryError;
    }
  }
}

function shouldSkipDatabaseReadsTemporarily() {
  return Date.now() < skipDatabaseReadsUntil;
}

function normalizeSlug(slug: string) {
  return slug.trim().replace(/^\/+|\/+$/g, "");
}

function normalizeDateString(input: Date | string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function parseRequiredString(
  value: unknown,
  field: keyof PostFrontmatter,
  fileName: string,
) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  throw new Error(`Invalid "${field}" in "${fileName}" frontmatter.`);
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function parseOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseTags(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const tags = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSearchTokens(query: string) {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function stripMarkdownForSearch(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function includesAllTokens(text: string, tokens: string[]) {
  return tokens.every((token) => text.includes(token));
}

function countContentWords(content: string) {
  const cjkMatches = content.match(/[\u3400-\u9fff]/g);
  const latinMatches = content.match(/[A-Za-z0-9]+/g);
  const cjkCount = cjkMatches?.length ?? 0;
  const latinCount = latinMatches?.length ?? 0;
  return cjkCount + latinCount;
}

function estimateWordCountFromReadingTime(readingTimeText: string) {
  const minuteMatch = readingTimeText.match(/(\d+(\.\d+)?)/);
  const minutes = minuteMatch ? Number.parseFloat(minuteMatch[1]) : 0;
  if (!Number.isFinite(minutes) || minutes <= 0) return undefined;
  return Math.max(120, Math.round(minutes * 260));
}

function parseFrontmatter(
  data: unknown,
  fileName: string,
  fileSlug: string,
): PostFrontmatter {
  const frontmatter = (data ?? {}) as Record<string, unknown>;
  const customSlug = parseOptionalString(frontmatter.slug);
  const date = parseRequiredString(frontmatter.date, "date", fileName);

  if (!isValidDateString(date)) {
    throw new Error(`Invalid "date" format in "${fileName}" frontmatter. Use YYYY-MM-DD.`);
  }

  return {
    title: parseRequiredString(frontmatter.title, "title", fileName),
    description: parseRequiredString(
      frontmatter.description,
      "description",
      fileName,
    ),
    date,
    updated: parseOptionalString(frontmatter.updated),
    tags: parseTags(frontmatter.tags),
    cover: parseOptionalString(frontmatter.cover),
    draft: frontmatter.draft === true,
    slug: normalizeSlug(customSlug ?? fileSlug),
  };
}

function shouldIncludePost(post: Pick<PostFrontmatter, "draft">) {
  if (!isProduction()) return true;
  return post.draft !== true;
}

function sortByDateDesc<T extends { date: string }>(posts: T[]) {
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

async function getPostFileNames() {
  try {
    const entries = await fs.readdir(POSTS_DIRECTORY, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => SUPPORTED_EXTENSIONS.has(path.extname(fileName)));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

async function readPostFromFile(fileName: string) {
  const filePath = path.join(POSTS_DIRECTORY, fileName);
  const fileContent = await fs.readFile(filePath, "utf8");
  const parsed = matter(fileContent);
  const fileSlug = normalizeSlug(path.parse(fileName).name);
  const frontmatter = parseFrontmatter(parsed.data, fileName, fileSlug);

  const meta: PostMeta = {
    ...frontmatter,
    slug: frontmatter.slug ?? fileSlug,
    readingTime: readingTime(parsed.content).text,
    wordCount: countContentWords(parsed.content),
  };

  return { meta, content: parsed.content };
}

function warnInvalidPostFile(fileName: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[posts] skip invalid post "${fileName}": ${message}`);
}

async function getAllPostsFromFileSystem() {
  const fileNames = await getPostFileNames();
  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      try {
        return await readPostFromFile(fileName);
      } catch (error) {
        warnInvalidPostFile(fileName, error);
        return null;
      }
    }),
  );

  const filtered = posts
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .map((post) => post.meta)
    .filter((post) => shouldIncludePost(post));

  return sortByDateDesc(filtered);
}

async function getPostBySlugFromFileSystem(slug: string) {
  const targetSlug = normalizeSlug(slug);
  const fileNames = await getPostFileNames();

  for (const fileName of fileNames) {
    let post: Awaited<ReturnType<typeof readPostFromFile>>;
    try {
      post = await readPostFromFile(fileName);
    } catch (error) {
      warnInvalidPostFile(fileName, error);
      continue;
    }
    if (post.meta.slug !== targetSlug) continue;
    if (!shouldIncludePost(post.meta)) return null;

    return {
      ...post.meta,
      content: post.content,
    } satisfies Post;
  }

  return null;
}

async function readPostSourceContent(sourceUrl: string) {
  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new Error(`Invalid sourceUrl: "${sourceUrl}"`);
  }

  const objectKey = tryGetOssObjectKeyFromUrl(sourceUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let fetchFailureMessage: string | null = null;

  try {
    const response = await fetch(sourceUrl, {
      cache: "force-cache",
      next: { revalidate: POST_CONTENT_REVALIDATE_SECONDS },
      signal: controller.signal,
    });
    if (response.ok) {
      return await response.text();
    }
    fetchFailureMessage = `Failed to fetch source: ${response.status}`;
  } catch (error) {
    fetchFailureMessage =
      error instanceof Error
        ? `Failed to fetch source request: ${error.message}`
        : `Failed to fetch source request: ${String(error)}`;
  } finally {
    clearTimeout(timer);
  }

  if (objectKey) {
    try {
      return await downloadTextFromOss({
        objectKey,
        revalidate: POST_CONTENT_REVALIDATE_SECONDS,
      });
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      throw new Error(`${fetchFailureMessage}; OSS fallback failed: ${fallbackMessage}`);
    }
  }

  throw new Error(fetchFailureMessage ?? `Failed to fetch source: ${sourceUrl}`);
}

async function getAllPostsFromDatabase() {
  let dbPosts: Array<{
    slug: string;
    title: string;
    description: string;
    date: Date;
    updated: Date | null;
    tags: string[];
    coverUrl: string | null;
    draft: boolean;
    readingTime: string;
    viewCount: number;
  }>;

  try {
    dbPosts = await withPrismaReadRetry(() =>
      prisma.post.findMany({
        where: isProduction() ? { draft: false } : undefined,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: {
          slug: true,
          title: true,
          description: true,
          date: true,
          updated: true,
          tags: true,
          coverUrl: true,
          draft: true,
          readingTime: true,
          viewCount: true,
        },
      }),
    );
  } catch (error) {
    if (!isMissingViewCountColumnError(error)) {
      throw error;
    }
    const legacyPosts = await withPrismaReadRetry(() =>
      prisma.post.findMany({
        where: isProduction() ? { draft: false } : undefined,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: {
          slug: true,
          title: true,
          description: true,
          date: true,
          updated: true,
          tags: true,
          coverUrl: true,
          draft: true,
          readingTime: true,
        },
      }),
    );
    dbPosts = legacyPosts.map((item) => ({
      ...item,
      viewCount: 0,
    }));
  }

  return dbPosts
    .map((post) => {
      const tags = post.tags.filter((tag) => typeof tag === "string" && tag.trim());
      return {
        slug: normalizeSlug(post.slug),
        title: post.title,
        description: post.description,
        date: normalizeDateString(post.date),
        updated: post.updated ? normalizeDateString(post.updated) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        cover: post.coverUrl ?? undefined,
        draft: post.draft,
        readingTime: post.readingTime,
        viewCount: post.viewCount,
        wordCount: estimateWordCountFromReadingTime(post.readingTime),
      } satisfies PostMeta;
    })
    .filter((post) => shouldIncludePost(post));
}

async function getPostBySlugFromDatabase(slug: string) {
  const targetSlug = normalizeSlug(slug);
  if (!targetSlug) return null;

  let dbPost: {
    slug: string;
    title: string;
    description: string;
    date: Date;
    updated: Date | null;
    tags: string[];
    coverUrl: string | null;
    draft: boolean;
    sourceUrl: string;
    readingTime: string;
    viewCount: number;
  } | null;

  try {
    dbPost = await withPrismaReadRetry(() =>
      prisma.post.findUnique({
        where: { slug: targetSlug },
        select: {
          slug: true,
          title: true,
          description: true,
          date: true,
          updated: true,
          tags: true,
          coverUrl: true,
          draft: true,
          sourceUrl: true,
          readingTime: true,
          viewCount: true,
        },
      }),
    );
  } catch (error) {
    if (!isMissingViewCountColumnError(error)) {
      throw error;
    }
    const legacyPost = await withPrismaReadRetry(() =>
      prisma.post.findUnique({
        where: { slug: targetSlug },
        select: {
          slug: true,
          title: true,
          description: true,
          date: true,
          updated: true,
          tags: true,
          coverUrl: true,
          draft: true,
          sourceUrl: true,
          readingTime: true,
        },
      }),
    );
    dbPost = legacyPost
      ? {
          ...legacyPost,
          viewCount: 0,
        }
      : null;
  }
  if (!dbPost) return null;
  if (!shouldIncludePost(dbPost)) return null;

  const rawSource = await readPostSourceContent(dbPost.sourceUrl);
  const parsed = matter(rawSource);
  const tags = dbPost.tags.filter((tag) => typeof tag === "string" && tag.trim());

  return {
    slug: normalizeSlug(dbPost.slug),
    title: dbPost.title,
    description: dbPost.description,
    date: normalizeDateString(dbPost.date),
    updated: dbPost.updated ? normalizeDateString(dbPost.updated) : undefined,
    tags: tags.length > 0 ? tags : undefined,
    cover: dbPost.coverUrl ?? undefined,
    draft: dbPost.draft,
    readingTime: dbPost.readingTime,
    viewCount: dbPost.viewCount,
    content: parsed.content,
  } satisfies Post;
}

async function hasPostBySlugFromDatabase(slug: string) {
  const targetSlug = normalizeSlug(slug);
  if (!targetSlug) return false;

  const post = await withPrismaReadRetry(() =>
    prisma.post.findUnique({
      where: { slug: targetSlug },
      select: {
        draft: true,
      },
    }),
  );
  if (!post) return false;
  return shouldIncludePost(post);
}

async function hasPostBySlugFromFileSystem(slug: string) {
  const post = await getPostBySlugFromFileSystem(slug);
  return Boolean(post);
}

async function getVisibleCommentCountMap() {
  try {
    const rows = await withPrismaReadRetry(() =>
      prisma.comment.groupBy({
        by: ["postSlug"],
        where: { status: "visible" },
        _count: { _all: true },
      }),
    );
    return new Map(rows.map((row) => [normalizeSlug(row.postSlug), row._count._all]));
  } catch {
    return new Map<string, number>();
  }
}

async function attachListMetrics(posts: PostMeta[]) {
  if (posts.length === 0) return posts;
  const commentCountMap = await getVisibleCommentCountMap();
  return posts.map((post) => ({
    ...post,
    commentCount: commentCountMap.get(normalizeSlug(post.slug)) ?? post.commentCount ?? 0,
    wordCount: post.wordCount ?? estimateWordCountFromReadingTime(post.readingTime),
  }));
}

export async function getAllPosts() {
  if (!isDatabaseContentSource()) {
    const posts = await getAllPostsFromFileSystem();
    return attachListMetrics(posts);
  }

  if (allowFileFallback() && shouldSkipDatabaseReadsTemporarily()) {
    const posts = await getAllPostsFromFileSystem();
    return attachListMetrics(posts);
  }

  try {
    const posts = await getAllPostsFromDatabase();
    if (posts.length > 0 || !allowFileFallback()) {
      return attachListMetrics(sortByDateDesc(posts));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[posts] database source failed, fallback to files: ${message}`);
    if (!allowFileFallback()) {
      throw error;
    }
  }

  const posts = await getAllPostsFromFileSystem();
  return attachListMetrics(posts);
}

export async function getPostBySlug(slug: string) {
  if (!isDatabaseContentSource()) {
    return getPostBySlugFromFileSystem(slug);
  }

  if (allowFileFallback() && shouldSkipDatabaseReadsTemporarily()) {
    return getPostBySlugFromFileSystem(slug);
  }

  try {
    const post = await getPostBySlugFromDatabase(slug);
    if (post || !allowFileFallback()) {
      return post;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[posts] database post fetch failed, fallback to files: ${message}`);
    if (!allowFileFallback()) {
      throw error;
    }
  }

  return getPostBySlugFromFileSystem(slug);
}

export async function getAllTags() {
  const posts = await getAllPosts();
  const tagMap = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tag: string) {
  const target = tag.trim().toLowerCase();
  if (!target) return [];

  const posts = await getAllPosts();
  return posts.filter((post) =>
    (post.tags ?? []).some((item) => item.toLowerCase() === target),
  );
}

function getSearchScore(post: PostMeta, contentText: string, tokens: string[]) {
  const titleText = post.title.toLowerCase();
  const descriptionText = post.description.toLowerCase();
  const tagsText = (post.tags ?? []).join(" ").toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (titleText.includes(token)) score += 8;
    if (tagsText.includes(token)) score += 5;
    if (descriptionText.includes(token)) score += 3;
    if (contentText.includes(token)) score += 1;

    const titleMatches = titleText.match(new RegExp(escapeRegExp(token), "g"))?.length ?? 0;
    const descriptionMatches =
      descriptionText.match(new RegExp(escapeRegExp(token), "g"))?.length ?? 0;
    score += Math.min(3, titleMatches + descriptionMatches);
  }

  return score;
}

export async function searchPosts(query: string) {
  const normalized = query.trim();
  if (!normalized) {
    return getAllPosts();
  }

  const tokens = toSearchTokens(normalized);
  if (tokens.length === 0) {
    return getAllPosts();
  }

  const posts = await getAllPosts();
  if (posts.length === 0) {
    return [];
  }

  const matched = await Promise.all(
    posts.map(async (post) => {
      const metaText = `${post.title} ${post.description} ${(post.tags ?? []).join(" ")}`
        .toLowerCase()
        .trim();

      let contentText = "";
      const metaMatched = includesAllTokens(metaText, tokens);

      if (!metaMatched) {
        const detail = await getPostBySlug(post.slug);
        if (!detail) return null;
        contentText = stripMarkdownForSearch(detail.content);
        if (!includesAllTokens(contentText, tokens)) {
          return null;
        }
      }

      return {
        post,
        score: getSearchScore(post, contentText, tokens),
      };
    }),
  );

  return matched
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    })
    .map((item) => item.post);
}

export async function hasPostBySlug(slug: string) {
  if (!isDatabaseContentSource()) {
    return hasPostBySlugFromFileSystem(slug);
  }

  if (allowFileFallback() && shouldSkipDatabaseReadsTemporarily()) {
    return hasPostBySlugFromFileSystem(slug);
  }

  try {
    const exists = await hasPostBySlugFromDatabase(slug);
    if (exists || !allowFileFallback()) {
      return exists;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[posts] database post existence check failed, fallback to files: ${message}`);
    if (!allowFileFallback()) {
      throw error;
    }
  }

  return hasPostBySlugFromFileSystem(slug);
}
