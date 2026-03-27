"use client";

import type { JSX } from "react";
import { evaluate } from "@mdx-js/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { mdxComponents } from "@/components/mdx/components";

type MDXContentComponent = (
  props: { components?: Record<string, unknown> },
) => JSX.Element;

type ViewMode = "typora" | "edit" | "split" | "preview";

interface MarkdownLiveEditorProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

type EditResult = {
  text: string;
  selectionStart: number;
  selectionEnd: number;
};

type RenderedLine =
  | { type: "blank"; sourceIndex: number; raw: string; text: string }
  | {
      type: "heading";
      sourceIndex: number;
      raw: string;
      text: string;
      level: 1 | 2 | 3 | 4 | 5 | 6;
    }
  | { type: "quote"; sourceIndex: number; raw: string; text: string }
  | { type: "ul"; sourceIndex: number; raw: string; text: string }
  | { type: "ol"; sourceIndex: number; raw: string; text: string; order: number }
  | {
      type: "task";
      sourceIndex: number;
      raw: string;
      text: string;
      checked: boolean;
    }
  | { type: "hr"; sourceIndex: number; raw: string; text: string }
  | { type: "codeFence"; sourceIndex: number; raw: string; text: string }
  | { type: "codeLine"; sourceIndex: number; raw: string; text: string }
  | { type: "paragraph"; sourceIndex: number; raw: string; text: string };

function stripFrontmatter(source: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return normalized;
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return normalized;
  }
  return normalized.slice(end + 5);
}

async function evaluatePreviewComponent(source: string) {
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
    ],
  });
  return evaluated.default as MDXContentComponent;
}

function wrapSelection(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string,
): EditResult {
  const prefix = source.slice(0, selectionStart);
  const selectedRaw = source.slice(selectionStart, selectionEnd);
  const suffix = source.slice(selectionEnd);
  const selected = selectedRaw || placeholder;
  const text = `${prefix}${before}${selected}${after}${suffix}`;
  const start = selectionStart + before.length;
  const end = start + selected.length;
  return {
    text,
    selectionStart: start,
    selectionEnd: end,
  };
}

function prefixLines(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  prefixText: string,
  fallbackText = "",
): EditResult {
  const selectedRaw = source.slice(selectionStart, selectionEnd);
  const selected = selectedRaw || fallbackText;
  const prefixed = selected
    .split("\n")
    .map((line) => `${prefixText}${line}`)
    .join("\n");
  const text =
    source.slice(0, selectionStart) + prefixed + source.slice(selectionEnd);
  return {
    text,
    selectionStart,
    selectionEnd: selectionStart + prefixed.length,
  };
}

function unindentBySpaces(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  count: number,
): EditResult {
  const selectedRaw = source.slice(selectionStart, selectionEnd);
  const selected = selectedRaw;
  const pattern = new RegExp(`^ {1,${count}}`);
  const next = selected
    .split("\n")
    .map((line) => line.replace(pattern, ""))
    .join("\n");
  const text = source.slice(0, selectionStart) + next + source.slice(selectionEnd);
  return {
    text,
    selectionStart,
    selectionEnd: selectionStart + next.length,
  };
}

function insertCodeBlock(
  source: string,
  selectionStart: number,
  selectionEnd: number,
): EditResult {
  const selected = source.slice(selectionStart, selectionEnd).trim() || "code";
  const block = `\n\`\`\`\n${selected}\n\`\`\`\n`;
  const text =
    source.slice(0, selectionStart) + block + source.slice(selectionEnd);
  const start = selectionStart + 5;
  return {
    text,
    selectionStart: start,
    selectionEnd: start + selected.length,
  };
}

function classifyMarkdownLines(source: string) {
  const lines = source.split("\n");
  const output: RenderedLine[] = [];
  let inCodeFence = false;
  let startIndex = 0;

  // Typora 模式不显示 frontmatter，仅显示正文内容。
  // 兼容场景：文件开头存在 BOM 或空行。
  const firstNonEmptyIndex = lines.findIndex(
    (line) => line.replace(/^\uFEFF/, "").trim() !== "",
  );
  if (firstNonEmptyIndex >= 0) {
    const firstMeaningful = lines[firstNonEmptyIndex]?.replace(/^\uFEFF/, "").trim();
    if (firstMeaningful === "---") {
      const endIndex = lines.findIndex(
        (line, index) => index > firstNonEmptyIndex && line.trim() === "---",
      );
      if (endIndex !== -1) {
        startIndex = endIndex + 1;
      }
    }
  }

  for (let sourceIndex = startIndex; sourceIndex < lines.length; sourceIndex += 1) {
    const rawLine = lines[sourceIndex] ?? "";
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("```")) {
      output.push({
        type: "codeFence",
        sourceIndex,
        raw: rawLine,
        text: rawLine,
      });
      inCodeFence = !inCodeFence;
      continue;
    }

    if (inCodeFence) {
      output.push({
        type: "codeLine",
        sourceIndex,
        raw: rawLine,
        text: rawLine,
      });
      continue;
    }

    if (!trimmed) {
      output.push({
        type: "blank",
        sourceIndex,
        raw: rawLine,
        text: rawLine,
      });
      continue;
    }

    const heading = rawLine.match(/^\s*(#{1,6})\s+(.+)$/);
    if (heading) {
      output.push({
        type: "heading",
        sourceIndex,
        raw: rawLine,
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2],
      });
      continue;
    }

    const quote = rawLine.match(/^\s*>\s?(.*)$/);
    if (quote) {
      output.push({
        type: "quote",
        sourceIndex,
        raw: rawLine,
        text: quote[1],
      });
      continue;
    }

    const task = rawLine.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)$/);
    if (task) {
      output.push({
        type: "task",
        sourceIndex,
        raw: rawLine,
        checked: task[1].toLowerCase() === "x",
        text: task[2],
      });
      continue;
    }

    const ul = rawLine.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      output.push({
        type: "ul",
        sourceIndex,
        raw: rawLine,
        text: ul[1],
      });
      continue;
    }

    const ol = rawLine.match(/^\s*(\d+)\.\s+(.*)$/);
    if (ol) {
      output.push({
        type: "ol",
        sourceIndex,
        raw: rawLine,
        order: Number(ol[1]),
        text: ol[2],
      });
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(rawLine)) {
      output.push({
        type: "hr",
        sourceIndex,
        raw: rawLine,
        text: rawLine,
      });
      continue;
    }

    output.push({
      type: "paragraph",
      sourceIndex,
      raw: rawLine,
      text: rawLine,
    });
  }

  return output;
}

function updateLineAt(source: string, index: number, nextLine: string) {
  const lines = source.split("\n");
  if (index < 0 || index >= lines.length) {
    return source;
  }
  lines[index] = nextLine;
  return lines.join("\n");
}

function insertLineAfter(source: string, index: number, line = "") {
  const lines = source.split("\n");
  const safeIndex = Math.max(0, Math.min(index, lines.length - 1));
  lines.splice(safeIndex + 1, 0, line);
  return lines.join("\n");
}

function TyporaLikeEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const lines = useMemo(() => classifyMarkdownLines(value), [value]);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number | null>(null);
  const [activeSource, setActiveSource] = useState("");
  const [linePreviewMap, setLinePreviewMap] = useState<Record<number, MDXContentComponent>>({});
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const skipBlurCommitRef = useRef(false);

  const focusEditorToEnd = (size: number) => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(size, size);
    });
  };

  useEffect(() => {
    let active = true;
    const previewable = lines.filter(
      (line) =>
        line.type !== "blank" &&
        line.type !== "hr" &&
        line.type !== "codeFence" &&
        line.type !== "codeLine",
    );
    if (previewable.length === 0) {
      queueMicrotask(() => {
        if (!active) return;
        startTransition(() => {
          setLinePreviewMap({});
        });
      });
      return () => {
        active = false;
      };
    }

    void (async () => {
      const entries = await Promise.all(
        previewable.map(async (line) => {
          try {
            const component = await evaluatePreviewComponent(line.raw);
            return [line.sourceIndex, component] as const;
          } catch {
            return [line.sourceIndex, null] as const;
          }
        }),
      );
      if (!active) return;
      startTransition(() => {
        const next: Record<number, MDXContentComponent> = {};
        for (const [sourceIndex, component] of entries) {
          if (component) {
            next[sourceIndex] = component;
          }
        }
        setLinePreviewMap(next);
      });
    })();

    return () => {
      active = false;
    };
  }, [lines]);

  const commit = () => {
    if (skipBlurCommitRef.current) {
      skipBlurCommitRef.current = false;
      return;
    }
    if (activeSourceIndex === null) return;
    onChange(updateLineAt(value, activeSourceIndex, activeSource));
    setActiveSourceIndex(null);
  };

  const renderDisplayLine = (line: RenderedLine) => {
    switch (line.type) {
      case "blank":
        return <div className="h-6" />;
      case "hr":
        return <hr className="border-border" />;
      case "codeFence":
      case "codeLine":
        return (
          <pre className="overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs text-foreground">
            {line.raw}
          </pre>
        );
      case "heading":
      case "quote":
      case "ul":
      case "ol":
      case "task":
      case "paragraph":
        if (linePreviewMap[line.sourceIndex]) {
          const Content = linePreviewMap[line.sourceIndex];
          return (
            <article className="prose prose-slate max-w-none dark:prose-invert [&>*]:my-0 [&>*]:leading-7">
              <Content components={mdxComponents} />
            </article>
          );
        }
        return <p className="text-sm leading-7 text-foreground">{line.text}</p>;
    }
  };

  return (
    <div className="h-[560px] overflow-y-auto rounded-md border border-border bg-background p-3">
      <div className="space-y-1">
        {lines.map((line, index) => (
          <div key={`${line.sourceIndex}-${index}-${line.raw}`}>
            {activeSourceIndex === line.sourceIndex ? (
              <textarea
                ref={inputRef}
                value={activeSource}
                onChange={(event) => setActiveSource(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    skipBlurCommitRef.current = true;
                    setActiveSourceIndex(null);
                    return;
                  }
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    skipBlurCommitRef.current = true;
                    const nextText = updateLineAt(value, line.sourceIndex, activeSource);
                    const withNewLine = insertLineAfter(nextText, line.sourceIndex, "");
                    onChange(withNewLine);
                    setActiveSourceIndex(line.sourceIndex + 1);
                    setActiveSource("");
                    focusEditorToEnd(0);
                    return;
                  }
                }}
                disabled={disabled}
                rows={1}
                className="w-full resize-none border-0 border-transparent bg-transparent px-2 py-1 font-mono text-sm text-foreground shadow-none outline-none ring-0 transition-none focus:border-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60"
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (disabled) return;
                  const nextSource = value.split("\n")[line.sourceIndex] ?? "";
                  setActiveSourceIndex(line.sourceIndex);
                  setActiveSource(nextSource);
                  focusEditorToEnd(nextSource.length);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (disabled) return;
                    const nextSource = value.split("\n")[line.sourceIndex] ?? "";
                    setActiveSourceIndex(line.sourceIndex);
                    setActiveSource(nextSource);
                    focusEditorToEnd(nextSource.length);
                  }
                }}
                className="block w-full cursor-text bg-transparent p-0 text-left outline-none"
              >
                <div className="cursor-text px-2 py-1">
                  {renderDisplayLine(line)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarkdownLiveEditor({
  value,
  onChange,
  disabled = false,
}: MarkdownLiveEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const deferredValue = useDeferredValue(value);
  const [viewMode, setViewMode] = useState<ViewMode>("typora");
  const [previewComponent, setPreviewComponent] = useState<MDXContentComponent | null>(
    null,
  );
  const [previewError, setPreviewError] = useState("");

  const stats = useMemo(() => {
    const lines = value ? value.split("\n").length : 0;
    const chars = value.length;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    return { lines, chars, words };
  }, [value]);

  const sourceForPreview = useMemo(
    () => stripFrontmatter(deferredValue),
    [deferredValue],
  );
  const hasPreviewSource = sourceForPreview.trim().length > 0;

  useEffect(() => {
    let active = true;

    if (!hasPreviewSource) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const evaluated = await evaluatePreviewComponent(sourceForPreview);
        if (!active) return;
        startTransition(() => {
          setPreviewComponent(() => evaluated);
          setPreviewError("");
        });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : String(error);
        startTransition(() => {
          setPreviewComponent(null);
          setPreviewError(message);
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [hasPreviewSource, sourceForPreview]);

  const apply = (
    editor: (
      source: string,
      selectionStart: number,
      selectionEnd: number,
    ) => EditResult,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) {
      return;
    }

    const { selectionStart, selectionEnd } = textarea;
    const result = editor(value, selectionStart, selectionEnd);
    onChange(result.text);

    requestAnimationFrame(() => {
      const element = textareaRef.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const onToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        apply((source, start, end) => wrapSelection(source, start, end, "**", "**", "加粗文本"));
        return;
      case "italic":
        apply((source, start, end) => wrapSelection(source, start, end, "*", "*", "斜体文本"));
        return;
      case "h1":
        apply((source, start, end) => prefixLines(source, start, end, "# "));
        return;
      case "h2":
        apply((source, start, end) => prefixLines(source, start, end, "## "));
        return;
      case "quote":
        apply((source, start, end) => prefixLines(source, start, end, "> "));
        return;
      case "ul":
        apply((source, start, end) => prefixLines(source, start, end, "- "));
        return;
      case "ol":
        apply((source, start, end) => prefixLines(source, start, end, "1. "));
        return;
      case "inline-code":
        apply((source, start, end) => wrapSelection(source, start, end, "`", "`", "code"));
        return;
      case "link":
        apply((source, start, end) =>
          wrapSelection(source, start, end, "[", "](https://example.com)", "链接文字"),
        );
        return;
      case "image":
        apply((source, start, end) =>
          wrapSelection(source, start, end, "![", "](https://example.com/image.png)", "图片描述"),
        );
        return;
      case "code-block":
        apply((source, start, end) => insertCodeBlock(source, start, end));
        return;
      default:
    }
  };

  const onEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isPrimary = event.metaKey || event.ctrlKey;
    if (isPrimary && event.key.toLowerCase() === "b") {
      event.preventDefault();
      onToolbarAction("bold");
      return;
    }
    if (isPrimary && event.key.toLowerCase() === "i") {
      event.preventDefault();
      onToolbarAction("italic");
      return;
    }
    if (isPrimary && event.key.toLowerCase() === "k" && event.shiftKey) {
      event.preventDefault();
      onToolbarAction("code-block");
      return;
    }
    if (isPrimary && event.key.toLowerCase() === "k") {
      event.preventDefault();
      onToolbarAction("link");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        apply((source, start, end) => unindentBySpaces(source, start, end, 2));
      } else {
        apply((source, start, end) => prefixLines(source, start, end, "  "));
      }
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("h1")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          H1
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("h2")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          H2
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("bold")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          加粗
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("italic")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          斜体
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("inline-code")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          行内代码
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("code-block")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          代码块
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("link")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          链接
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("image")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          图片
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("quote")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          引用
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("ul")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          无序列表
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToolbarAction("ol")}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          有序列表
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-fg">
        <p>
          字符 {stats.chars} · 词数 {stats.words} · 行数 {stats.lines}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("typora")}
            className={`rounded px-2 py-1 transition-colors ${
              viewMode === "typora"
                ? "bg-accent/15 text-accent"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Typora
          </button>
          <button
            type="button"
            onClick={() => setViewMode("edit")}
            className={`rounded px-2 py-1 transition-colors ${
              viewMode === "edit"
                ? "bg-accent/15 text-accent"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`rounded px-2 py-1 transition-colors ${
              viewMode === "split"
                ? "bg-accent/15 text-accent"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            分屏
          </button>
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`rounded px-2 py-1 transition-colors ${
              viewMode === "preview"
                ? "bg-accent/15 text-accent"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            预览
          </button>
        </div>
      </div>

      <div
        className={`grid gap-4 ${
          viewMode === "split" ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""
        }`}
      >
        {viewMode === "typora" ? (
          <TyporaLikeEditor value={value} onChange={onChange} disabled={disabled} />
        ) : null}

        {viewMode === "edit" || viewMode === "split" ? (
          <div className="min-w-0">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={onEditorKeyDown}
              rows={22}
              disabled={disabled}
              className="h-[560px] w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none ring-accent/30 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-muted-fg">
              快捷键：Ctrl/Cmd+B 加粗，Ctrl/Cmd+I 斜体，Ctrl/Cmd+K 链接，Ctrl/Cmd+Shift+K 代码块。
            </p>
          </div>
        ) : null}

        {viewMode === "split" || viewMode === "preview" ? (
          <div className="min-w-0 rounded-md border border-border bg-background p-4">
            {previewError ? (
              <pre className="whitespace-pre-wrap text-xs text-red-700 dark:text-red-300">
                预览编译失败：{previewError}
              </pre>
            ) : !hasPreviewSource ? (
              <p className="text-sm text-muted-fg">暂无可预览内容。</p>
            ) : previewComponent ? (
              <article className="prose prose-slate max-w-none dark:prose-invert">
                {previewComponent({ components: mdxComponents })}
              </article>
            ) : (
              <p className="text-sm text-muted-fg">预览编译中...</p>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
