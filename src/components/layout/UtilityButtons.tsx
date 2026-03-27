"use client";

import { useEffect, useState } from "react";
import { readEffectiveSakurairoPreferencesFromRoot } from "@/lib/sakurairo-preferences";
import { ThemeToggle } from "./ThemeToggle";

export function UtilityButtons() {
  const [showToTop, setShowToTop] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setShowToTop(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => {
      const preferences = readEffectiveSakurairoPreferencesFromRoot();
      setVisible(preferences.globalShowUtilityButtons);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed bottom-[5.5rem] right-3 z-30 flex flex-col items-end gap-2 sm:bottom-24 sm:right-5">
      <div className="pointer-events-auto rounded-md border border-border/70 bg-surface-soft p-1 shadow-[var(--shadow-soft)] backdrop-blur">
        <ThemeToggle />
      </div>
      <button
        type="button"
        aria-label="回到顶部"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-md border border-border/70 bg-surface-soft text-muted-fg shadow-[var(--shadow-soft)] backdrop-blur transition-all duration-300 hover:text-foreground ${
          showToTop ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-75 opacity-0"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
