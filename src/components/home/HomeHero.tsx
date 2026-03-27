"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function getSocialItems() {
  const items = [];
  const { github, twitter, email } = siteConfig.author.social;
  if (github) items.push({ label: "GitHub", href: github, icon: "G" });
  if (twitter) items.push({ label: "Twitter/X", href: twitter, icon: "X" });
  if (email) items.push({ label: "Email", href: email, icon: "@" });
  return items;
}

export function HomeHero({ title, subtitle, postsCount }: HomeHeroProps) {
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [typedWordIndex, setTypedWordIndex] = useState(0);
  const [heroSettings, setHeroSettings] = useState(() =>
    readEffectiveSakurairoPreferencesFromRoot(),
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  const typingWords = useMemo(
    () => (siteConfig.author.skills.length > 0 ? siteConfig.author.skills : ["Next.js"]),
    [],
  );
  const socialItems = getSocialItems();
  const activeBackground = HERO_BACKGROUNDS[activeBackgroundIndex];
  const avatarSrc = heroSettings.preliminaryAvatarUrl || siteConfig.author.avatar;
  const quoteText = heroSettings.homepageHeroSignature || subtitle;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(HERO_BG_STORAGE_KEY);
      if (stored) {
        const index = Number.parseInt(stored, 10);
        if (!Number.isNaN(index) && index >= 0 && index < HERO_BACKGROUNDS.length) {
          setActiveBackgroundIndex(index);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(HERO_BG_STORAGE_KEY, String(activeBackgroundIndex));
    } catch {
      // ignore storage errors
    }
  }, [activeBackgroundIndex, ready]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const enabled = heroSettings.homepageHeroTypingEffect && !reducedMotion;
    if (!enabled) return;
    const timer = window.setInterval(() => {
      setTypedWordIndex((previous) => (previous + 1) % typingWords.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [heroSettings.homepageHeroTypingEffect, reducedMotion, typingWords.length]);

  useEffect(() => {
    const intervalSec = heroSettings.homepageHeroAutoBackgroundSec;
    if (intervalSec <= 0) return;
    const timer = window.setInterval(() => {
      setActiveBackgroundIndex((current) => (current + 1) % HERO_BACKGROUNDS.length);
    }, intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [heroSettings.homepageHeroAutoBackgroundSec]);

  useEffect(() => {
    const sync = () => setHeroSettings(readEffectiveSakurairoPreferencesFromRoot());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
    };
  }, []);

  return (
    <section className="headertop filter-dot">
      <div id="banner_wave_1" />
      <div id="banner_wave_2" />

      <figure
        id="centerbg"
        className="centerbg"
        style={{ backgroundImage: `url("${activeBackground.image}")` }}
      >
        <div
          className="hero-overlay"
          style={{
            opacity: heroSettings.homepageHeroOverlayOpacity,
          }}
        />

        <div className="focusinfo">
          <div className="header-tou">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="avatar"
                src={avatarSrc}
                width={132}
                height={132}
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>

          <div
            className="header-info"
            style={{
              backgroundColor: `rgba(255,255,255,${heroSettings.homepageHeroInfoCardOpacity})`,
            }}
          >
            <span className="element">{quoteText}</span>
            <p>
              {title} · {heroSettings.homepageHeroTypingEffect ? typingWords[typedWordIndex] : typingWords[0]}
            </p>
            <p className="hero-subtitle">{subtitle}</p>
          </div>

          {heroSettings.homepageHeroShowSocial ? (
            <ul className="top-social">
              {socialItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                    title={item.label}
                  >
                    <span>{item.icon}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="hero-tools">
            <button
              type="button"
              className="bg-switch"
              onClick={() => {
                setActiveBackgroundIndex((current) =>
                  pickRandomIndex(current, HERO_BACKGROUNDS.length),
                );
              }}
            >
              切换背景
            </button>
            {heroSettings.homepageHeroShowStats ? (
              <span className="hero-count">已发布 {postsCount} 篇文章</span>
            ) : null}
            {heroSettings.homepageHeroShowStats ? (
              <span className="hero-count">当前背景：{activeBackground.label}</span>
            ) : null}
          </div>
        </div>
      </figure>

      {heroSettings.homepageHeroShowScrollHint ? (
        <div
          className="headertop-down"
          onClick={() => {
            const target = document.getElementById("home-latest");
            if (!target) return;
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <span>⌄</span>
        </div>
      ) : null}
    </section>
  );
}
