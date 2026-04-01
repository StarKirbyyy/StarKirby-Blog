"use client";

import {
  Children,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { CodeBlock } from "./CodeBlock";

type PreProps = HTMLAttributes<HTMLPreElement> & {
  children?: ReactNode;
};

function getLanguage(
  className: string | undefined,
  dataLanguage: unknown,
): string | undefined {
  const fromData =
    typeof dataLanguage === "string" && dataLanguage.trim()
      ? dataLanguage.trim()
      : undefined;

  if (fromData) return fromData;
  if (!className) return undefined;

  const languageToken = className
    .split(/\s+/)
    .find((token) => token.startsWith("language-"));

  return languageToken?.replace("language-", "");
}

export function Pre({ children, className, ...props }: PreProps) {
  const nodes = Children.toArray(children);
  const codeNode = nodes.find(
    (node) =>
      isValidElement<{ className?: string; children?: ReactNode }>(node) &&
      node.type === "code",
  );

  if (!codeNode || !isValidElement<{ className?: string; children?: ReactNode }>(codeNode)) {
    return (
      <pre className={className} {...props}>
        {children}
      </pre>
    );
  }

  const codeClassName =
    typeof codeNode.props.className === "string" ? codeNode.props.className : undefined;
  const dataLanguage =
    (props as Record<string, unknown>)["data-language"] ??
    (props as Record<string, unknown>)["dataLanguage"];
  const language = getLanguage(codeClassName, dataLanguage);
  const codeChildren = codeNode.props.children as ReactNode;

  return (
    <CodeBlock language={language} code={codeChildren}>
      <pre className="codeblock-pre m-0 max-h-[32rem] overflow-auto text-sm" {...props}><code className={`codeblock-code ${codeClassName ?? ""}`.trim()}>{codeChildren}</code></pre>
    </CodeBlock>
  );
}
