export function stripInlineMarkdown(input: string) {
  return input
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function normalizeHeadingComparable(input: string) {
  return stripInlineMarkdown(input).replace(/\s+/g, " ").trim().toLowerCase();
}

interface RemoveDuplicateTitleHeadingOptions {
  postTitle?: string;
}

export function removeLeadingDuplicateTitleHeading(
  source: string,
  options: RemoveDuplicateTitleHeadingOptions = {},
) {
  const rawPostTitle = options.postTitle?.trim();
  if (!rawPostTitle) return source;

  const normalizedTitle = normalizeHeadingComparable(rawPostTitle);
  if (!normalizedTitle) return source;

  const lines = source.split("\n");
  let firstContentLineIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim()) {
      firstContentLineIndex = index;
      break;
    }
  }

  if (firstContentLineIndex < 0) return source;

  const firstLine = lines[firstContentLineIndex];
  const headingMatch = firstLine.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (!headingMatch) return source;

  const headingLevel = headingMatch[1].length;
  if (headingLevel !== 1) return source;

  const headingText = headingMatch[2];
  const normalizedHeading = normalizeHeadingComparable(headingText);
  if (!normalizedHeading || normalizedHeading !== normalizedTitle) {
    return source;
  }

  const removeUntil =
    lines[firstContentLineIndex + 1]?.trim() === ""
      ? firstContentLineIndex + 2
      : firstContentLineIndex + 1;

  const nextLines = [
    ...lines.slice(0, firstContentLineIndex),
    ...lines.slice(removeUntil),
  ];

  return nextLines.join("\n");
}
