export function GlobalBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "var(--global-bg-image, none)" }}
      />
      <div className="global-bg-mask absolute inset-0 backdrop-blur-md" />
    </div>
  );
}
