const FIRMS = [
  "Goldman Sachs",
  "Morgan Stanley",
  "J.P. Morgan",
  "Evercore",
  "Lazard",
  "Centerview",
  "PJT Partners",
  "Moelis & Co",
  "Jefferies",
  "Houlihan Lokey",
  "Rothschild & Co",
  "Barclays",
  "Guggenheim",
  "Qatalyst",
  "Perella Weinberg",
  "RBC Capital Markets",
];

/** Ticker of firms covered in chapter 03 and the firm library. Pauses on hover. */
export function FirmTicker() {
  const doubled = [...FIRMS, ...FIRMS];

  return (
    <section aria-label="Firms covered in the guide" className="border-b py-4">
      <p className="eyebrow text-center">Ch 03 · The desks you&apos;re prepping for</p>
      <div className="group relative mt-3 overflow-hidden">
        <div className="animate-ticker flex w-max group-hover:[animation-play-state:paused]">
          {doubled.map((name, i) => (
            <span
              key={`${name}-${i}`}
              aria-hidden={i >= FIRMS.length}
              className="flex shrink-0 items-center"
            >
              <span className="text-muted-foreground hover:text-foreground cursor-default px-6 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors">
                {name}
              </span>
              <span className="bg-border h-3 w-px" />
            </span>
          ))}
        </div>
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r to-transparent" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l to-transparent" />
      </div>
    </section>
  );
}
