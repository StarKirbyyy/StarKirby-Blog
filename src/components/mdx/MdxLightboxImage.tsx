"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface MdxLightboxImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  isRemote: boolean;
  useNativeImage?: boolean;
}

export function MdxLightboxImage({
  src,
  alt,
  width,
  height,
  isRemote,
  useNativeImage = false,
}: MdxLightboxImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden text-left"
        data-mdx-image="true"
        aria-label={alt ? `查看大图：${alt}` : "查看图片大图"}
      >
        {useNativeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(min-width: 1024px) 768px, 100vw"
            className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.01]"
            unoptimized={isRemote}
          />
        )}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/65 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          点击放大
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt || "图片预览"}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded bg-white/20 px-3 py-1 text-sm text-white transition-colors hover:bg-white/30"
          >
            关闭
          </button>

          <div
            className="w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            {useNativeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="mx-auto h-auto max-h-[85vh] w-auto"
                loading="eager"
              />
            ) : (
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                sizes="100vw"
                className="mx-auto h-auto max-h-[85vh] w-auto"
                unoptimized={isRemote}
                priority
              />
            )}
            {alt ? (
              <p className="mt-3 text-center text-sm text-white/90">{alt}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
