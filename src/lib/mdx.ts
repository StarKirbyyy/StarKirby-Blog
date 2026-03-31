import type { JSX } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";

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

function stripScriptTagsFromMdx(source: string) {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "");
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

export async function getMDXContent(source: string) {
  const sanitizedSource = stripScriptTagsFromMdx(source);
  const format = detectLikelyMdxSyntax(sanitizedSource) ? "mdx" : "md";
  const evaluated = await evaluate(sanitizedSource, {
    ...jsxRuntime,
    format,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
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
    ],
  });

  return evaluated.default as MDXContentComponent;
}
