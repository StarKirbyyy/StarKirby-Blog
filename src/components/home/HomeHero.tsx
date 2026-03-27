"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { readEffectiveSakurairoPreferencesFromRoot } from "@/lib/sakurairo-preferences";

type HomeHeroProps = {
  title: string;
  subtitle: string;
  postsCount: number;
};

type HeroBackground = {
  id: string;
  label: string;
  image: string;
};

const HERO_BACKGROUNDS: HeroBackground[] = [
  {
    id: "hello-cover",
    label: "Hello Starkirby",
    image: "/images/covers/hello-starkirby-blog.svg",
  },
  {
    id: "next-cover",
    label: "App Router Notes",
    image: "/images/covers/nextjs-app-router-notes.svg",
  },
  {
    id: "theme-cover",
    label: "Theme Playground",
    image: "/images/covers/experimental-theme-playground.svg",
  },
];
const HERO_BG_STORAGE_KEY = "home-hero-bg-index";

function pickRandomIndex(current: number, size: number) {
  if (size <= 1) return current;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * size);
  }
  return next;
}

export function HomeHero({ title, subtitle, postsCount }: HomeHeroProps) {
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [typedWordIndex, setTypedWordIndex] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [heroSettings, setHeroSettings] = useState(() =>
    readEffectiveSakurairoPreferencesFromRoot(),
  );
  const activeBackground = HERO_BACKGROUNDS[activeBackgroundIndex];
  const typingWords =
    siteConfig.author.skills.length > 0 ? siteConfig.author.skills : ["Next.js", "TypeScript"];
  const avatarSrc = heroSettings.preliminaryAvatarUrl || siteConfig.author.avatar;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HERO_BG_STORAGE_KEY);
      if (!stored) return;
      const index = Number.parseInt(stored, 10);
      if (Number.isNaN(index) || index < 0 || index >= HERO_BACKGROUNDS.length) return;
      setActiveBackgroundIndex(index);
    } catch {
      // ignore storage read errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HERO_BG_STORAGE_KEY, String(activeBackgroundIndex));
    } catch {
      // ignore storage write errors
    }
  }, [activeBackgroundIndex]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion || !heroSettings.homepageHeroTypingEffect) return;
    const timer = window.setInterval(() => {
      setTypedWordIndex((previous) => (previous + 1) % typingWords.length);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [reducedMotion, typingWords.length, heroSettings.homepageHeroTypingEffect]);

  useEffect(() => {
    const intervalSec = heroSettings.homepageHeroAutoBackgroundSec;
    if (intervalSec <= 0) return;
    const timer = window.setInterval(() => {
      setActiveBackgroundIndex((current) => (current + 1) % HERO_BACKGROUNDS.length);
    }, intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [heroSettings.homepageHeroAutoBackgroundSec]);

  useEffect(() => {
    const onScroll = () => {
      const screenPart = window.innerHeight / 3;
      const percentage = Math.min(window.scrollY / screenPart, 0.9);
      setBgOpacity(percentage);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => {
      setHeroSettings(readEffectiveSakurairoPreferencesFromRoot());
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
    <section className="relative min-h-[62vh] overflow-hidden rounded-[10px] border border-border bg-surface shadow-[var(--shadow-soft)] sm:min-h-[72vh]">
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all ${reducedMotion ? "duration-100" : "duration-500"}`}
          style={{ backgroundImage: `url("${activeBackground.image}")` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom right, rgba(0,0,0,${heroSettings.homepageHeroOverlayOpacity + 0.14}), rgba(0,0,0,${heroSettings.homepageHeroOverlayOpacity * 0.72}), rgba(0,0,0,${heroSettings.homepageHeroOverlayOpacity + 0.2}))`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div
          className={`absolute inset-0 bg-background transition-opacity ${reducedMotion ? "duration-75" : "duration-200"}`}
          style={{ opacity: bgOpacity }}
        />
      </div>

      <div className="relative z-10 flex min-h-[62vh] flex-col items-center justify-center p-5 text-center sm:min-h-[72vh] sm:p-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={`${siteConfig.author.name} 头像`}
          width={148}
          height={148}
          className="h-28 w-28 rounded-full border border-white/45 object-cover shadow-lg transition-transform duration-500 hover:rotate-[360deg] sm:h-36 sm:w-36"
          loading="eager"
          referrerPolicy="no-referrer"
        />

        <div
          className="mt-4 w-full max-w-3xl rounded-[10px] border border-white/35 px-5 py-4 backdrop-blur-md sm:mt-5 sm:px-6 sm:py-5"
          style={{
            backgroundColor: `rgba(255,255,255,${heroSettings.homepageHeroInfoCardOpacity})`,
          }}
        >
          <h1 className="text-2xl font-medium tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-white/92 sm:text-base">
            Hi, I&apos;m {siteConfig.author.name}. Working with{" "}
            <span className="font-semibold text-[var(--theme-skin-matching)]">
              {heroSettings.homepageHeroTypingEffect ? typingWords[typedWordIndex] : typingWords[0]}
            </span>
            .
          </p>
          <p className="mt-2 text-xs leading-6 text-white/82 sm:text-sm">
            {heroSettings.homepageHeroSignature || subtitle}
          </p>
        </div>

        {heroSettings.homepageHeroShowSocial ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={siteConfig.author.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/28"
            >
              GitHub
            </a>
            {siteConfig.author.social.email ? (
              <a
                href={siteConfig.author.social.email}
                className="rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/28"
              >
                Email
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/posts"
            className="inline-flex items-center rounded-full bg-white/88 px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-white"
          >
            阅读文章
          </Link>
          {heroSettings.homepageHeroShowScrollHint ? (
            <a
              href="#home-latest"
              className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm text-white transition-colors hover:bg-white/25"
            >
              向下浏览
            </a>
          ) : null}
          {heroSettings.homepageHeroShowStats ? (
            <span className="rounded-full border border-white/30 bg-black/24 px-3 py-1.5 text-xs text-white/88">
              已发布 {postsCount} 篇内容
            </span>
          ) : null}
          {heroSettings.homepageHeroShowStats ? (
            <span className="rounded-full border border-white/30 bg-black/24 px-3 py-1.5 text-xs text-white/88">
              当前背景：{activeBackground.label}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setActiveBackgroundIndex((current) =>
                pickRandomIndex(current, HERO_BACKGROUNDS.length),
              );
            }}
            className="rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/28"
          >
            随机换张背景
          </button>
        </div>
      </div>
    </section>
  );
}
