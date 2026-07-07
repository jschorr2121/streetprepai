"use client";

const banks = [
  "Goldman Sachs",
  "JPMorgan",
  "Morgan Stanley",
  "Evercore",
  "Bank of America",
  "Lazard",
  "Centerview Partners",
  "PJT Partners",
  "Moelis & Co",
  "Jefferies",
  "Houlihan Lokey",
  "Rothschild",
  "Barclays",
  "Deutsche Bank",
  "Guggenheim",
  "RBC Capital Markets",
];

export function LogoTicker() {
  const doubled = [...banks, ...banks];

  return (
    <div className="bg-muted/20 overflow-hidden border-b py-7">
      <p className="text-muted-foreground mb-5 text-center text-[11px] font-semibold tracking-[0.15em] uppercase">
        Where our students land
      </p>

      <div className="relative">
        {/* Track */}
        <div className="animate-ticker flex gap-0" style={{ width: "max-content" }}>
          {doubled.map((name, i) => (
            <span key={`${name}-${i}`} className="flex items-center gap-0 whitespace-nowrap">
              <span className="text-foreground/70 hover:text-foreground cursor-default px-7 text-sm font-semibold transition-colors">
                {name}
              </span>
              <span className="text-muted-foreground/40 select-none">·</span>
            </span>
          ))}
        </div>

        {/* Edge fades */}
        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r to-transparent" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l to-transparent" />
      </div>
    </div>
  );
}
