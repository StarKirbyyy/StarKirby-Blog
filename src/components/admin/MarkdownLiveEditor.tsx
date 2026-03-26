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

type ViewMode = "edit" | "split" | "preview";

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
): EditResult {
  const selectedRaw = source.slice(selectionStart, selectionEnd);
  const selected = selectedRaw || "内容";
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
  const selected = selectedRaw || "内容";
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

export function MarkdownLiveEditor({
  value,
  onChange,
  disabled = false,
}: MarkdownLiveEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const deferredValue = useDeferredValue(value);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
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
        const evaluated = await evaluate(sourceForPreview, {
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
        if (!active) return;
        startTransition(() => {
          setPreviewComponent(() => evaluated.default as MDXContentComponent);
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
        {viewMode !== "preview" ? (
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

        {viewMode !== "edit" ? (
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
