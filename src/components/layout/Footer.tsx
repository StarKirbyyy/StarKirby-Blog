"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import {
  readEffectiveSakurairoPreferencesFromRoot,
  type FooterMode,
} from "@/lib/sakurairo-preferences";

export function Footer() {
  const year = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [footerMode, setFooterMode] = useState<FooterMode>("auto");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (footerMode === "static") {
        setVisible(true);
        return;
      }

      const noScrollableArea =
        document.documentElement.scrollHeight <= window.innerHeight + 80;
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 12;
      setVisible(noScrollableArea || nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [footerMode]);

  useEffect(() => {
    const sync = () => {
      const preferences = readEffectiveSakurairoPreferencesFromRoot();
      setFooterMode(preferences.globalFooterMode);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
    };
  }, []);

  const content = (
    <div className="glass-panel pointer-events-auto rounded-[10px] px-6 py-5 sm:px-7 sm:py-6">
      <p className="text-center text-base text-foreground sm:text-lg">
        {siteConfig.name}
      </p>
      <p className="mt-2 text-center text-sm text-muted-fg sm:text-base">
        © {year} {siteConfig.author.name}. All rights reserved.
      </p>
    </div>
  );

  if (!mounted) {
    return null;
  }

  if (footerMode === "static") {
    return (
      <footer className="content-shell mt-8 pb-6">
        {content}
      </footer>
    );
  }

  return (
    <footer
      className={`pointer-events-none fixed inset-x-0 bottom-3 z-30 mx-auto w-[92%] max-w-[640px] footer-float ${
        visible ? "footer-float-visible" : "footer-float-hidden"
      }`}
    >
      {content}
    </footer>
  );
}
