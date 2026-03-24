import type { ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pre } from "./Pre";

type AnchorProps = ComponentPropsWithoutRef<"a">;
type ImageProps = ComponentPropsWithoutRef<"img">;
type CodeProps = ComponentPropsWithoutRef<"code">;
type TableProps = ComponentPropsWithoutRef<"table">;

const FALLBACK_IMAGE_WIDTH = 1200;
const FALLBACK_IMAGE_HEIGHT = 630;

function toDimension(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function MdxAnchor({ href, children, ...props }: AnchorProps) {
  if (!href) {
    return (
      <a {...props}>
        {children}
      </a>
    );
  }

  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function MdxImage({ src, alt = "", width, height }: ImageProps) {
  if (typeof src !== "string" || !src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={toDimension(width, FALLBACK_IMAGE_WIDTH)}
      height={toDimension(height, FALLBACK_IMAGE_HEIGHT)}
      className="h-auto w-full rounded-xl border border-border"
      unoptimized
    />
  );
}

function MdxCode({ className, ...props }: CodeProps) {
  // 无 className 视为行内 code
  if (className) {
    return <code className={className} {...props} />;
  }
  return (
    <code
      className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-foreground"
      {...props}
    />
  );
}

function MdxTable(props: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}

export const mdxComponents = {
  a: MdxAnchor,
  img: MdxImage,
  pre: Pre,
  code: MdxCode,
  table: MdxTable,
};
