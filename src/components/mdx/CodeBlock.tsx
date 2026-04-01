"use client";

import { isValidElement, useState, type ReactNode } from "react";

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((item) => extractText(item)).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return "";
}

interface CodeBlockProps {
  language?: string;
  code: ReactNode;
  children: ReactNode;
}

export function CodeBlock({ language, code, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const text = extractText(code).trimEnd();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className={`rounded-md border border-border px-2 py-1 text-xs transition-colors ${
            copied
              ? "bg-accent/10 text-accent [animation:copy-pop_220ms_ease-out]"
              : "text-muted-fg hover:bg-background hover:text-foreground"
          }`}
          aria-label="复制代码"
        >
          {copied ? "✓ 已复制" : "复制"}
        </button>
      </div>
      {children}
    </div>
  );
}
