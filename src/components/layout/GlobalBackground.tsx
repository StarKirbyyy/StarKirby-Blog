"use client";

import { useEffect, useState } from "react";
import { readEffectiveSakurairoPreferencesFromRoot } from "@/lib/sakurairo-preferences";

export function GlobalBackground() {
  const [backgroundUrl, setBackgroundUrl] = useState("");

  useEffect(() => {
    const sync = () => {
      const preferences = readEffectiveSakurairoPreferencesFromRoot();
      const url =
        typeof preferences.globalBackgroundImageUrl === "string"
          ? preferences.globalBackgroundImageUrl.trim()
          : "";
      setBackgroundUrl(url);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      {backgroundUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${backgroundUrl}")` }}
        />
      ) : null}
      <div className="global-bg-mask absolute inset-0 backdrop-blur-md" />
    </div>
  );
}
