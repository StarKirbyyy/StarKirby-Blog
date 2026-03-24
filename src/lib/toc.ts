export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function stripMarkdown(input: string) {
  return input
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function slugify(text: string) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");

  return normalized || "section";
}

export function extractTableOfContents(content: string) {
  const lines = content.split("\n");
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

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    const text = stripMarkdown(match[2]);
    if (!text) continue;

    const baseSlug = slugify(text);
    const duplicateIndex = slugCount.get(baseSlug) ?? 0;
    slugCount.set(baseSlug, duplicateIndex + 1);
    const id = duplicateIndex === 0 ? baseSlug : `${baseSlug}-${duplicateIndex}`;

    toc.push({ id, text, level });
  }

  return toc;
}
