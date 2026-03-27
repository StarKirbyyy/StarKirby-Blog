export function GlobalBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0" style={{ backgroundImage: "var(--global-bg-base)" }} />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--grid-dot)_1px,transparent_0)] bg-[length:20px_20px]"
        style={{ opacity: "var(--global-bg-dot-opacity)" }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: "var(--global-bg-overlay)" }} />
    </div>
  );
}
