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
  let pendingSetextHeadingText: string | null = null;

  const pushTocItem = (rawLevel: number, rawText: string) => {
    const level = Math.min(6, Math.max(1, rawLevel)) as 1 | 2 | 3 | 4 | 5 | 6;
    const text = stripInlineMarkdown(rawText);
    if (!text) return;

    const baseSlug = slugify(text);
    const duplicateIndex = slugCount.get(baseSlug) ?? 0;
    slugCount.set(baseSlug, duplicateIndex + 1);
    const id = duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`;

    toc.push({ id, text, level });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      pendingSetextHeadingText = null;
      continue;
    }
    if (inCodeFence) continue;

    if (!trimmed) {
      pendingSetextHeadingText = null;
      continue;
    }

    const htmlHeadingMatch = trimmed.match(
      /^<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>\s*$/i,
    );
    if (htmlHeadingMatch) {
      pushTocItem(Number(htmlHeadingMatch[1]), htmlHeadingMatch[2]);
      pendingSetextHeadingText = null;
      continue;
    }

    const atxHeadingMatch = line.match(/^\s{0,3}(#{1,6})\s*(.+?)\s*#*\s*$/);
    if (atxHeadingMatch) {
      pushTocItem(atxHeadingMatch[1].length, atxHeadingMatch[2]);
      pendingSetextHeadingText = null;
      continue;
    }

    // Setext heading support:
    // Heading text
    // ---- (h2) or ==== (h1)
    if (/^={2,}\s*$/.test(trimmed) && pendingSetextHeadingText) {
      pushTocItem(1, pendingSetextHeadingText);
      pendingSetextHeadingText = null;
      continue;
    }
    if (/^-{2,}\s*$/.test(trimmed) && pendingSetextHeadingText) {
      pushTocItem(2, pendingSetextHeadingText);
      pendingSetextHeadingText = null;
      continue;
    }

    pendingSetextHeadingText = trimmed;
  }

  return toc;
}
