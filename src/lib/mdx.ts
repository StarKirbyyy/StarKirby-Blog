import type { JSX } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { removeLeadingDuplicateTitleHeading } from "@/lib/markdown";

type MDXContentComponent = (
  props: { components?: Record<string, unknown> },
) => JSX.Element;

const prettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
} as const;

function extractFootnoteLabelFromRef(value: string) {
  const cleaned = value.replace(/^#/, "");
  const idMatch = cleaned.match(/fnref-([^#?]+)/i);
  if (idMatch?.[1]) return decodeURIComponent(idMatch[1]);
  const hrefMatch = cleaned.match(/fn-([^#?]+)/i);
  if (hrefMatch?.[1]) return decodeURIComponent(hrefMatch[1]);
  return null;
}

function rehypeFootnoteLabelFromId() {
  return (tree: unknown) => {
    const visit = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const element = node as {
        type?: string;
        tagName?: string;
        properties?: Record<string, unknown>;
        children?: unknown[];
      };

      if (
        element.type === "element" &&
        element.tagName === "a" &&
        element.properties &&
        "dataFootnoteRef" in element.properties
      ) {
        const fromId =
          typeof element.properties.id === "string"
            ? extractFootnoteLabelFromRef(element.properties.id)
            : null;
        const fromHref =
          typeof element.properties.href === "string"
            ? extractFootnoteLabelFromRef(element.properties.href)
            : null;
        const label = fromId ?? fromHref;
        if (label) {
          element.properties["data-footnote-label"] = label;
          element.children = [{ type: "text", value: label }];
        }
      }

      if (
        element.type === "element" &&
        element.tagName === "li" &&
        element.properties &&
        typeof element.properties.id === "string"
      ) {
        const label = extractFootnoteLabelFromRef(element.properties.id);
        if (label) {
          element.properties["data-footnote-label"] = label;

          const firstParagraph = Array.isArray(element.children)
            ? element.children.find(
                (child) =>
                  child &&
                  typeof child === "object" &&
                  (child as { type?: string; tagName?: string }).type === "element" &&
                  (child as { tagName?: string }).tagName === "p",
              )
            : null;

          if (
            firstParagraph &&
            typeof firstParagraph === "object" &&
            Array.isArray((firstParagraph as { children?: unknown[] }).children)
          ) {
            const paragraph = firstParagraph as {
              children: Array<{
                type?: string;
                tagName?: string;
                properties?: Record<string, unknown>;
              }>;
            };
            const hasPrefixedLabel = paragraph.children.some(
              (child) =>
                child?.type === "element" &&
                child.tagName === "span" &&
                Array.isArray(child.properties?.className) &&
                child.properties.className.includes("footnote-label"),
            );

            if (!hasPrefixedLabel) {
              paragraph.children.unshift({
                type: "element",
                tagName: "span",
                properties: { className: ["footnote-label"] },
                children: [{ type: "text", value: `[^${label}]: ` }],
              } as unknown as {
                type?: string;
                tagName?: string;
                properties?: Record<string, unknown>;
              });
            }
          }
        }
      }

      if (Array.isArray(element.children)) {
        for (const child of element.children) {
          visit(child);
        }
      }
    };

    visit(tree);
  };
}

function stripScriptTagsFromMdx(source: string) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "");
}

function normalizeSupSubTagsToMath(source: string) {
  return source
    .replace(/<sub>\s*([^<]+?)\s*<\/sub>/gi, (_match, content: string) => {
      const text = content.trim();
      return text ? `$_{${text}}$` : "";
    })
    .replace(/<sup>\s*([^<]+?)\s*<\/sup>/gi, (_match, content: string) => {
      const text = content.trim();
      return text ? `$^{${text}}$` : "";
    });
}

function transformOutsideCodeFences(
  source: string,
  transformLine: (line: string) => string,
) {
  const lines = source.split("\n");
  let inCodeFence = false;

  const nextLines = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      return line;
    }
    if (inCodeFence) {
      return line;
    }
    return transformLine(line);
  });

  return nextLines.join("\n");
}

function transformOutsideInlineCode(
  line: string,
  transformSegment: (segment: string) => string,
) {
  const segments = line.split(/(`[^`\r\n]*`)/g);
  return segments
    .map((segment) => {
      if (segment.startsWith("`") && segment.endsWith("`")) {
        return segment;
      }
      return transformSegment(segment);
    })
    .join("");
}

function normalizeFootnoteLabel(rawLabel: string) {
  const cleaned = rawLabel.replace(/`/g, "").trim().replace(/\s+/g, " ");
  return cleaned || rawLabel.trim();
}

function normalizeFootnoteDefinitionSyntax(source: string) {
  return transformOutsideCodeFences(source, (line) =>
    line.replace(/^\s*\[\^([^\]\r\n]+)\]\s*[：:]\s*/u, (_match, rawLabel: string) => {
      const label = normalizeFootnoteLabel(rawLabel);
      return `[^${label}]: `;
    }),
  );
}

function normalizeFootnoteReferenceSyntax(source: string) {
  return transformOutsideCodeFences(source, (line) =>
    transformOutsideInlineCode(line, (segment) =>
      segment.replace(
        /\[\^([^\]\r\n]+)\]/g,
        (_match, rawLabel: string) => `[^${normalizeFootnoteLabel(rawLabel)}]`,
      ),
    ),
  );
}

function normalizeMarkHighlightSyntax(source: string) {
  return transformOutsideCodeFences(source, (line) =>
    transformOutsideInlineCode(line, (segment) =>
      segment.replace(/==([^=\n][^=\n]*?)==/g, "<mark>$1</mark>"),
    ),
  );
}

function normalizeEscapedPunctuation(source: string) {
  const entities: Record<string, string> = {
    "*": "&#42;",
    _: "&#95;",
    "`": "&#96;",
    "#": "&#35;",
    "[": "&#91;",
    "]": "&#93;",
    "(": "&#40;",
    ")": "&#41;",
  };
  return transformOutsideCodeFences(source, (line) =>
    transformOutsideInlineCode(line, (segment) =>
      segment.replace(
        /\\([*_[\]#()`])/g,
        (_match, token: string) => entities[token] ?? token,
      ),
    ),
  );
}

function detectLikelyMdxSyntax(source: string) {
  if (/^\s*(import|export)\s.+$/m.test(source)) {
    return true;
  }
  // Detect custom JSX component usage like <MyComponent ... />
  if (/<\s*[A-Z][\w.-]*(\s|\/?>)/.test(source)) {
    return true;
  }
  return false;
}

interface GetMDXContentOptions {
  postTitle?: string;
}

export async function getMDXContent(source: string, options: GetMDXContentOptions = {}) {
  const sourceWithoutDuplicateTitle = removeLeadingDuplicateTitleHeading(source, {
    postTitle: options.postTitle,
  });
  const sanitizedSource = stripScriptTagsFromMdx(sourceWithoutDuplicateTitle);
  const normalizedSource = normalizeMarkHighlightSyntax(
    normalizeEscapedPunctuation(
      normalizeFootnoteDefinitionSyntax(
        normalizeFootnoteReferenceSyntax(normalizeSupSubTagsToMath(sanitizedSource)),
      ),
    ),
  );
  const format = detectLikelyMdxSyntax(normalizedSource) ? "mdx" : "md";
  const evaluated = await evaluate(normalizedSource, {
    ...jsxRuntime,
    format,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeRaw,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["heading-anchor"],
            ariaLabel: "标题锚点",
          },
        },
      ],
      rehypeKatex,
      [rehypePrettyCode, prettyCodeOptions],
      rehypeFootnoteLabelFromId,
    ],
  });

  return evaluated.default as MDXContentComponent;
}
