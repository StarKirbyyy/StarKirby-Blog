"use client";

import { useEffect, useState } from "react";
import { readEffectiveSakurairoPreferencesFromRoot } from "@/lib/sakurairo-preferences";

interface SakurairoSiteAvatarProps {
  alt: string;
  className?: string;
  fallbackSrc: string;
  width: number;
  height: number;
}

export function SakurairoSiteAvatar({
  alt,
  className,
  fallbackSrc,
  width,
  height,
}: SakurairoSiteAvatarProps) {
  const [src, setSrc] = useState(fallbackSrc);

  useEffect(() => {
    const sync = () => {
      const preferences = readEffectiveSakurairoPreferencesFromRoot();
      setSrc(preferences.preliminaryAvatarUrl || fallbackSrc);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
    };
  }, [fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
