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
const PETAL_COUNT = 26;
const PETAL_VARIANT_POOL = [1, 2, 3, 10, 11, 12] as const;

type SakuraPetal = {
  id: string;
  left: number;
  size: number;
  duration: number;
  delay: number;
  startX: number;
  slideX: number;
  drift: number;
  rotate: number;
  variant: number;
  opacity: number;
};

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function createSakuraPetals(): SakuraPetal[] {
  const random = createSeededRandom(20260328);
  const petals: SakuraPetal[] = [];
  const minLeftGap = 2.6;
  const minDelayGap = 0.95;
  const pickVariant = () =>
    PETAL_VARIANT_POOL[Math.floor(random() * PETAL_VARIANT_POOL.length)];

  for (let index = 0; index < PETAL_COUNT; index += 1) {
    let candidate: SakuraPetal | null = null;

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const left = -5 + random() * 110;
      const delay = -(random() * 9.8 + index * 0.28);

      const isTooClose = petals.some(
        (petal) =>
          Math.abs(petal.left - left) < minLeftGap &&
          Math.abs(petal.delay - delay) < minDelayGap,
      );
      if (isTooClose) continue;

      candidate = {
        id: `petal-${index + 1}`,
        left,
        size: 7.6 + random() * 5.4,
        duration: 2.8 + random() * 1.4,
        delay,
        startX: -12 + random() * 28,
        slideX: 26 + random() * 20,
        drift: -6 + random() * 10,
        rotate: -70 + random() * 140,
        variant: pickVariant(),
        opacity: 0.9 + random() * 0.1,
      };
      break;
    }

    if (!candidate) {
      candidate = {
        id: `petal-${index + 1}`,
        left: -5 + (index / PETAL_COUNT) * 110,
        size: 10,
        duration: 3.3,
        delay: -(index * 0.36),
        startX: 0,
        slideX: 30,
        drift: 0,
        rotate: -25 + (index % 8) * 9,
        variant: PETAL_VARIANT_POOL[index % PETAL_VARIANT_POOL.length],
        opacity: 0.95,
      };
    }

    petals.push(candidate);
  }

  return petals;
}

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
  const [heroSettingsReady, setHeroSettingsReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [homeIntroReady, setHomeIntroReady] = useState(false);
  const [resolvedAvatarSrc, setResolvedAvatarSrc] = useState<string>("");
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [activeBackgroundLoaded, setActiveBackgroundLoaded] = useState(false);
  const [quoteTypedLength, setQuoteTypedLength] = useState(-1);

  const typingWords = useMemo(
    () => (siteConfig.author.skills.length > 0 ? siteConfig.author.skills : ["Next.js"]),
    [],
  );
  const sakuraPetals = useMemo(() => createSakuraPetals(), []);
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
  const activeBackgroundImage = activeBackground?.image ?? "";
  const avatarSrc = heroSettingsReady
    ? heroSettings.preliminaryAvatarUrl || siteConfig.author.avatar
    : "";
  const quoteText = heroSettings.homepageHeroSignature || subtitle;
  const quoteChars = useMemo(() => Array.from(quoteText), [quoteText]);
  const quoteTypedText = useMemo(
    () => (quoteTypedLength < 0 ? quoteText : quoteChars.slice(0, quoteTypedLength).join("")),
    [quoteChars, quoteText, quoteTypedLength],
  );
  const avatarReady = !avatarSrc || avatarLoaded || avatarFailed;
  const heroTextReady =
    mounted &&
    heroSettingsReady &&
    homeIntroReady &&
    avatarReady &&
    (!activeBackgroundImage || activeBackgroundLoaded);
  const focusInfoClassName = [
    "focusinfo",
    heroTextReady ? "home-profile-enter-ready" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!avatarSrc) {
      setResolvedAvatarSrc("");
      setAvatarLoaded(false);
      setAvatarFailed(false);
      return;
    }
    setResolvedAvatarSrc(avatarSrc);
    setAvatarLoaded(false);
    setAvatarFailed(false);
  }, [avatarSrc]);

  useEffect(() => {
    if (!activeBackgroundImage) {
      setActiveBackgroundLoaded(true);
      return;
    }

    let cancelled = false;
    setActiveBackgroundLoaded(false);

    void preloadImage(activeBackgroundImage)
      .then(() => {
        if (cancelled) return;
        setActiveBackgroundLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setActiveBackgroundLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBackgroundImage]);

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
    const sync = () => {
      setHeroSettings(readEffectiveSakurairoPreferencesFromRoot());
    };
    const onRuntimeReady = () => {
      sync();
      setHeroSettingsReady(true);
    };
    sync();
    if (document.documentElement.dataset.sakurairoRuntimeReady === "true") {
      setHeroSettingsReady(true);
    }
    window.addEventListener("storage", sync);
    window.addEventListener("sakurairo:preferences-change", sync as EventListener);
    window.addEventListener("sakurairo:runtime-ready", onRuntimeReady as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sakurairo:preferences-change", sync as EventListener);
      window.removeEventListener("sakurairo:runtime-ready", onRuntimeReady as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!heroSettingsReady) {
      setHomeIntroReady(false);
      document.documentElement.dataset.homeHeroReady = "false";
      return;
    }
    let cancelled = false;
    setHomeIntroReady(false);
    document.documentElement.dataset.homeHeroReady = "false";

    const sources = new Set<string>();
    for (const background of heroBackgrounds) {
      sources.add(background.image);
    }
    if (avatarSrc) sources.add(avatarSrc);

    const tasks = [...sources].map((src) => preloadImage(src));
    void Promise.allSettled(tasks)
      .then(() => {
        if (cancelled) return;
        setHomeIntroReady(true);
        document.documentElement.dataset.homeHeroReady = "true";
        window.dispatchEvent(new CustomEvent("home:hero-resources-ready"));
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, heroSettingsReady, heroBackgrounds, avatarSrc]);

  useEffect(() => {
    setQuoteTypedLength(-1);
    if (!mounted) return;
    if (!homeIntroReady) return;
    if (quoteChars.length === 0) return;
    if (reducedMotion) {
      setQuoteTypedLength(quoteChars.length);
      return;
    }

    setQuoteTypedLength(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setQuoteTypedLength(Math.min(index, quoteChars.length));
      if (index >= quoteChars.length) {
        window.clearInterval(timer);
      }
    }, 110);

    return () => window.clearInterval(timer);
  }, [mounted, homeIntroReady, quoteChars, reducedMotion]);

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
                  "--petal-slide-x": `${petal.slideX}vw`,
                  "--petal-drift": `${petal.drift}px`,
                  "--petal-rotate": `${petal.rotate}deg`,
                  "--petal-opacity": `${petal.opacity}`,
                } as CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/petals/petal-${petal.variant}.png`}
                className="sakura-petal-image"
                alt=""
                aria-hidden="true"
                loading="lazy"
                draggable={false}
              />
            </span>
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

        <div className={focusInfoClassName}>
          <div className="header-tou">
            <Link href="/">
              <div className="header-avatar-shell">
                {avatarSrc && (!avatarLoaded || avatarFailed) ? (
                  <span
                    className={`header-avatar-skeleton${avatarFailed ? " is-failed" : ""}`}
                    aria-hidden="true"
                  />
                ) : null}
                {!avatarFailed && avatarSrc && resolvedAvatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="avatar"
                    src={resolvedAvatarSrc}
                    width={132}
                    height={132}
                    className={`header-avatar-image${avatarLoaded ? " is-ready" : ""}`}
                    suppressHydrationWarning
                    onLoad={() => setAvatarLoaded(true)}
                    onError={() => {
                      setAvatarFailed(true);
                      setAvatarLoaded(false);
                    }}
                  />
                ) : null}
              </div>
            </Link>
          </div>

          <div className="header-info">
            <span
              className={`element hero-quote-typewriter${heroTextReady ? "" : " hero-text-skeleton-line is-main"}`}
              aria-hidden={heroTextReady ? undefined : true}
            >
              <span>{heroTextReady ? quoteTypedText : ""}</span>
              <span
                className={`hero-quote-caret${heroTextReady ? " is-visible" : ""}`}
                aria-hidden="true"
              >
                |
              </span>
            </span>
            <p className={heroTextReady ? "" : "hero-text-skeleton-line is-sub"} aria-hidden={heroTextReady ? undefined : true}>
              {heroTextReady
                ? `${title} · ${
                    heroSettings.homepageHeroTypingEffect ? typingWords[typedWordIndex] : typingWords[0]
                  }`
                : ""}
            </p>
            <p
              className={`hero-subtitle${heroTextReady ? "" : " hero-text-skeleton-line is-subtle"}`}
              aria-hidden={heroTextReady ? undefined : true}
            >
              {heroTextReady ? subtitle : ""}
            </p>
          </div>

          {heroTextReady && heroSettings.homepageHeroShowSocial ? (
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
