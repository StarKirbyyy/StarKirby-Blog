import { removeLeadingDuplicateTitleHeading, stripInlineMarkdown } from "@/lib/markdown";

export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

function slugify(text: string) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");

  return normalized || "section";
}

interface ExtractTableOfContentsOptions {
  postTitle?: string;
}

export function extractTableOfContents(
  content: string,
  options: ExtractTableOfContentsOptions = {},
) {
  const normalizedContent = removeLeadingDuplicateTitleHeading(content, {
    postTitle: options.postTitle,
  });
  const lines = normalizedContent.split("\n");
  const slugCount = new Map<string, number>();
  const toc: TocItem[] = [];
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;

    const baseSlug = slugify(text);
    const duplicateIndex = slugCount.get(baseSlug) ?? 0;
    slugCount.set(baseSlug, duplicateIndex + 1);
    const id = duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`;

    toc.push({ id, text, level });
  }

  return toc;
}
