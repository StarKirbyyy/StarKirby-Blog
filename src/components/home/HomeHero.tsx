"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { siteConfig } from "@/config/site";
import {
  getDefaultSakurairoPreferences,
  readEffectiveSakurairoPreferencesFromRoot,
} from "@/lib/sakurairo-preferences";

type HomeHeroProps = {
  title: string;
  subtitle: string;
};

type SocialItem = {
  label: string;
  href: string;
  icon: string;
};

const HERO_BG_STORAGE_KEY = "home-hero-bg-index";

function getSocialItems() {
  const items: SocialItem[] = [];
  const { github, twitter, email } = siteConfig.author.social;
  if (github) items.push({ label: "GitHub", href: github, icon: "G" });
  if (twitter) items.push({ label: "Twitter/X", href: twitter, icon: "X" });
  if (email) items.push({ label: "Email", href: email, icon: "@" });
  return items;
}

export function HomeHero({ title, subtitle }: HomeHeroProps) {
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [typedWordIndex, setTypedWordIndex] = useState(0);
  const [heroSettings, setHeroSettings] = useState(() =>
    getDefaultSakurairoPreferences(),
  );
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [resolvedAvatarSrc, setResolvedAvatarSrc] = useState<string>(
    siteConfig.author.avatar,
  );

  const typingWords = useMemo(
    () => (siteConfig.author.skills.length > 0 ? siteConfig.author.skills : ["Next.js"]),
    [],
  );
  const sakuraPetals = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: `petal-${index + 1}`,
        left: -5 + ((index * 9) % 110),
        size: 8 + (index % 6) * 2.2,
        duration: 5.2 + (index % 6) * 0.75,
        delay: -((index % 12) * 0.65),
        startX: -8 + (index % 8) * 6,
        slideMid: 18 + (index % 6) * 5,
        slideX: 20 + (index % 6) * 5,
        drift: -10 + (index % 8) * 3,
        rotate: -35 + (index % 10) * 8,
      })),
    [],
  );
  const heroBackgrounds = useMemo(() => {
    const raw = [
      heroSettings.homepageHeroBackgroundUrl1,
      heroSettings.homepageHeroBackgroundUrl2,
      heroSettings.homepageHeroBackgroundUrl3,
    ];
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .map((image, index) => ({
        id: `custom-bg-${index + 1}`,
        label: `背景 ${index + 1}`,
        image,
      }));
  }, [
    heroSettings.homepageHeroBackgroundUrl1,
    heroSettings.homepageHeroBackgroundUrl2,
    heroSettings.homepageHeroBackgroundUrl3,
  ]);
  const socialItems = getSocialItems();
  const activeBackground =
    heroBackgrounds.length > 0
      ? heroBackgrounds[activeBackgroundIndex % heroBackgrounds.length]
      : null;
  const avatarSrc = heroSettings.preliminaryAvatarUrl || siteConfig.author.avatar;
  const quoteText = heroSettings.homepageHeroSignature || subtitle;

  useEffect(() => {
    setResolvedAvatarSrc(avatarSrc);
  }, [avatarSrc]);

  useEffect(() => {
    if (heroBackgrounds.length === 0) {
      setActiveBackgroundIndex(0);
      setReady(true);
      return;
    }
    try {
      const stored = window.localStorage.getItem(HERO_BG_STORAGE_KEY);
      if (stored) {
        const index = Number.parseInt(stored, 10);
        if (!Number.isNaN(index) && index >= 0 && index < heroBackgrounds.length) {
          setActiveBackgroundIndex(index);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setReady(true);
    }
  }, [heroBackgrounds.length]);

  useEffect(() => {
    if (!ready || heroBackgrounds.length === 0) return;
    try {
      window.localStorage.setItem(HERO_BG_STORAGE_KEY, String(activeBackgroundIndex));
    } catch {
      // ignore storage errors
    }
  }, [activeBackgroundIndex, heroBackgrounds.length, ready]);

  useEffect(() => {
    if (heroBackgrounds.length === 0) return;
    setActiveBackgroundIndex((current) => current % heroBackgrounds.length);
  }, [heroBackgrounds.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (intervalSec <= 0 || heroBackgrounds.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveBackgroundIndex((current) => (current + 1) % heroBackgrounds.length);
    }, intervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [heroBackgrounds.length, heroSettings.homepageHeroAutoBackgroundSec]);

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
    <section className={`headertop filter-dot${activeBackground ? "" : " is-plain"}`}>
      <div id="banner_wave_1" />
      <div id="banner_wave_2" />
      {mounted && !reducedMotion ? (
        <div className="sakura-layer" aria-hidden="true">
          {sakuraPetals.map((petal) => (
            <span
              key={petal.id}
              className="sakura-petal"
              style={
                {
                  "--petal-left": `${petal.left}%`,
                  "--petal-size": `${petal.size}px`,
                  "--petal-duration": `${petal.duration}s`,
                  "--petal-delay": `${petal.delay}s`,
                  "--petal-start-x": `${petal.startX}px`,
                  "--petal-slide-mid": `${petal.slideMid}vw`,
                  "--petal-slide-x": `${petal.slideX}vw`,
                  "--petal-drift": `${petal.drift}px`,
                  "--petal-rotate": `${petal.rotate}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      <figure
        id="centerbg"
        className="centerbg"
        style={
          activeBackground
            ? { backgroundImage: `url("${activeBackground.image}")` }
            : { backgroundImage: "none" }
        }
      >
        {activeBackground ? (
          <div
            className="hero-overlay"
            style={{
              opacity: heroSettings.homepageHeroOverlayOpacity,
            }}
          />
        ) : null}

        <div className="focusinfo">
          <div className="header-tou">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="avatar"
                src={resolvedAvatarSrc}
                width={132}
                height={132}
                suppressHydrationWarning
                onError={() => {
                  setResolvedAvatarSrc(siteConfig.author.avatar);
                }}
              />
            </Link>
          </div>

          <div className="header-info">
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
          <span className="headertop-down-icon" aria-hidden="true">
            <svg
              viewBox="0 0 32 24"
              width="42"
              height="32"
              className="headertop-down-svg"
              focusable="false"
            >
              <path
                d="M6 6L16 16L26 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      ) : null}
    </section>
  );
}
