export function GlobalBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -left-28 top-[-180px] h-[420px] w-[420px] rounded-full bg-hero-a opacity-45 blur-3xl" />
      <div className="absolute -right-24 top-[8vh] h-[360px] w-[360px] rounded-full bg-hero-b opacity-35 blur-3xl" />
      <div className="absolute bottom-[-180px] left-[18%] h-[380px] w-[380px] rounded-full bg-hero-c opacity-30 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] bg-[length:20px_20px] opacity-70" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.22)_65%,rgba(255,255,255,0.38))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(10,15,24,0.25)_62%,rgba(10,15,24,0.45))]" />
    </div>
  );
}

