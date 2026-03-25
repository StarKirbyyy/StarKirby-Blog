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

export async function getMDXContent(source: string) {
  const evaluated = await evaluate(source, {
    ...jsxRuntime,
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
