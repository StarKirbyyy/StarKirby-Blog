import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const POSTS_DIRECTORY = path.join(process.cwd(), "content", "posts");
const SUPPORTED_EXTENSIONS = new Set([".mdx", ".md"]);

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

function normalizeSlug(slug: string) {
  return slug.trim().replace(/^\/+|\/+$/g, "");
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

function shouldIncludePost(post: PostFrontmatter) {
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
  };

  return { meta, content: parsed.content };
}

function warnInvalidPostFile(fileName: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[posts] skip invalid post "${fileName}": ${message}`);
}

export async function getAllPosts() {
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

export async function getPostBySlug(slug: string) {
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
