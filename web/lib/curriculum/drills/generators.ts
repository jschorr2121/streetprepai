// Parameterized drill generators — the "signature interactives" from
// context/curriculum.md §4. Each returns a self-contained drill with random
// numbers so answers can't be memorized, plus a computed answer key the client
// checks locally (no LLM needed for these deterministic drills). Pure functions;
// `rng` is injected so drills are reproducible in tests.

export type Rng = () => number;

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  // arr is always non-empty at every call site.
  return arr[Math.floor(rng() * arr.length)]!;
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export type DrillField = {
  key: string;
  label: string;
  /** Correct numeric value; the client checks |answer - value| <= tolerance. */
  value: number;
  tolerance: number;
  unit?: string;
};

export type Drill = {
  kind: DrillKind;
  prompt: string;
  fields: DrillField[];
  /** Worked explanation revealed after the user submits. */
  explanation: string;
};

export type DrillKind = "three-statement" | "tsm" | "accretion-dilution" | "paper-lbo";

// ─── Three-statement single-step change ───────────────────────────────────────

const THREE_STMT_ITEMS = [
  {
    key: "depreciation",
    label: "Depreciation increases by",
    // Pre-tax income falls by amount; effects flow from there.
    effect: (amt: number, tax: number) => {
      const ni = round(-amt * (1 - tax));
      const cash = round(amt - amt * (1 - tax)); // +D&A addback net of NI drop = +tax*amt
      return {
        netIncome: ni,
        cashChange: round(ni + amt),
        note: `Pre-tax income falls ${amt}, tax shield saves ${round(amt * tax)}, so net income falls ${Math.abs(ni)}. On the CFS, add back the ${amt} of non-cash depreciation, so cash rises ${round(ni + amt)}. On the BS, cash up ${round(ni + amt)} and PP&E down ${amt} (assets down ${Math.abs(ni)}); retained earnings down ${Math.abs(ni)}. Balances.`,
        _cash: cash,
      };
    },
  },
  {
    key: "writedown",
    label: "A non-cash inventory write-down of",
    effect: (amt: number, tax: number) => {
      const ni = round(-amt * (1 - tax));
      return {
        netIncome: ni,
        cashChange: round(ni + amt),
        note: `Write-down hits pre-tax income by ${amt}; net income falls ${Math.abs(ni)}. It's non-cash, so add it back on the CFS — cash rises ${round(ni + amt)} (the tax savings). On the BS, cash up ${round(ni + amt)}, inventory down ${amt}; retained earnings down ${Math.abs(ni)}. Balances.`,
      };
    },
  },
  {
    key: "accrued",
    label: "Accrued expenses (an operating expense) increase by",
    effect: (amt: number, tax: number) => {
      const ni = round(-amt * (1 - tax));
      return {
        netIncome: ni,
        cashChange: round(ni + amt),
        note: `The expense lowers pre-tax income by ${amt}; net income falls ${Math.abs(ni)}. But no cash left yet — the accrued liability rose ${amt}, a CFS add-back — so cash rises ${round(ni + amt)}. On the BS, cash up ${round(ni + amt)}, accrued liabilities up ${amt}; retained earnings down ${Math.abs(ni)}. Balances.`,
      };
    },
  },
] as const;

export function generateThreeStatement(rng: Rng): Drill {
  const item = pick(rng, THREE_STMT_ITEMS);
  const amount = randInt(rng, 2, 40) * 5; // multiples of 5
  const taxPct = pick(rng, [20, 25, 30, 35, 40] as const);
  const tax = taxPct / 100;
  const e = item.effect(amount, tax);
  return {
    kind: "three-statement",
    prompt: `${item.label} $${amount} (tax rate ${taxPct}%). Walk the three statements. What is the change in net income and the change in cash?`,
    fields: [
      { key: "netIncome", label: "Change in net income ($)", value: e.netIncome, tolerance: 0.5 },
      { key: "cashChange", label: "Change in cash ($)", value: e.cashChange, tolerance: 0.5 },
    ],
    explanation: e.note,
  };
}

// ─── Treasury stock method ────────────────────────────────────────────────────

export function generateTsm(rng: Rng): Drill {
  const shares = randInt(rng, 50, 500) * 10;
  const price = randInt(rng, 20, 80);
  const options = randInt(rng, 5, 40) * 5;
  const strike = randInt(rng, 5, price - 2); // in-the-money
  const proceeds = options * strike;
  const buyback = round(proceeds / price);
  const netNew = round(options - buyback);
  const diluted = round(shares + netNew);
  return {
    kind: "tsm",
    prompt: `A company has ${shares} basic shares and ${options} in-the-money options struck at $${strike}. The share price is $${price}. Using the treasury stock method, what is the diluted share count?`,
    fields: [
      { key: "diluted", label: "Diluted shares", value: diluted, tolerance: 1 },
    ],
    explanation: `Options raise $${proceeds} on exercise (${options} × $${strike}). The company repurchases $${proceeds} ÷ $${price} = ${buyback} shares. Net new shares = ${options} − ${buyback} = ${netNew}. Diluted count = ${shares} + ${netNew} = ${diluted}.`,
  };
}

// ─── Accretion / dilution (all-stock, simple EPS) ─────────────────────────────

export function generateAccretionDilution(rng: Rng): Drill {
  const acquirerPe = randInt(rng, 10, 25);
  const targetPe = randInt(rng, 8, 22);
  const acquirerNi = randInt(rng, 100, 500);
  const acquirerShares = randInt(rng, 50, 200);
  const targetNi = randInt(rng, 20, 120);

  const acquirerPrice = round((acquirerPe * acquirerNi) / acquirerShares);
  const targetEquityValue = targetPe * targetNi;
  const newShares = round(targetEquityValue / acquirerPrice);
  const combinedNi = acquirerNi + targetNi;
  const combinedShares = round(acquirerShares + newShares);
  const oldEps = round(acquirerNi / acquirerShares, 3);
  const newEps = round(combinedNi / combinedShares, 3);
  const accretionPct = round(((newEps - oldEps) / oldEps) * 100, 1);

  return {
    kind: "accretion-dilution",
    prompt: `Acquirer: $${acquirerNi} net income, ${acquirerShares} shares, ${acquirerPe}x P/E. Target: $${targetNi} net income, acquired for ${targetPe}x earnings in an all-stock deal. Is the deal accretive or dilutive, and by what % to EPS? (Ignore synergies and new-share fractional rounding effects.)`,
    fields: [
      {
        key: "accretion",
        label: "EPS accretion / (dilution) %",
        value: accretionPct,
        tolerance: 1.0,
        unit: "%",
      },
    ],
    explanation: `Acquirer share price = ${acquirerPe} × $${acquirerNi} ÷ ${acquirerShares} = $${acquirerPrice}. Purchase price = ${targetPe} × $${targetNi} = $${targetEquityValue}, funded with $${targetEquityValue} ÷ $${acquirerPrice} = ${newShares} new shares. Combined EPS = $${combinedNi} ÷ ${combinedShares} = $${newEps} vs standalone $${oldEps} — ${accretionPct >= 0 ? "accretive" : "dilutive"} ${accretionPct}%. Shortcut: acquirer P/E ${acquirerPe}x ${acquirerPe > targetPe ? ">" : "<"} target P/E ${targetPe}x, so ${acquirerPe > targetPe ? "accretive" : "dilutive"}.`,
  };
}

// ─── Paper LBO (returns estimate) ─────────────────────────────────────────────

export function generatePaperLbo(rng: Rng): Drill {
  const entryEbitda = randInt(rng, 50, 200);
  const entryMultiple = randInt(rng, 6, 11);
  const leverage = randInt(rng, 3, 6); // turns of debt
  const years = pick(rng, [3, 5] as const);
  const ebitdaCagr = pick(rng, [0, 5, 8, 10] as const) / 100;
  const exitMultiple = entryMultiple; // held flat for a clean paper LBO

  const entryTev = entryEbitda * entryMultiple;
  const debt = entryEbitda * leverage;
  const equityIn = round(entryTev - debt);
  const exitEbitda = round(entryEbitda * (1 + ebitdaCagr) ** years);
  const exitTev = round(exitEbitda * exitMultiple);
  // Simplifying paper-LBO assumption: no debt paydown, no cash build.
  const exitEquity = round(exitTev - debt);
  const moic = round(exitEquity / equityIn, 2);
  const irr = round((moic ** (1 / years) - 1) * 100, 1);

  return {
    kind: "paper-lbo",
    prompt: `Buy a company at ${entryMultiple}x $${entryEbitda} EBITDA with ${leverage}x turns of debt. EBITDA ${ebitdaCagr === 0 ? "is flat" : `grows ${ebitdaCagr * 100}%/yr`} over a ${years}-year hold; exit at the same ${entryMultiple}x. Assume no debt paydown. Estimate MOIC and IRR.`,
    fields: [
      { key: "moic", label: "MOIC (x)", value: moic, tolerance: 0.15, unit: "x" },
      { key: "irr", label: "IRR (%)", value: irr, tolerance: 2.5, unit: "%" },
    ],
    explanation: `Entry TEV = ${entryMultiple} × $${entryEbitda} = $${entryTev}; debt = ${leverage} × $${entryEbitda} = $${debt}; equity in = $${equityIn}. Exit EBITDA = $${exitEbitda}, exit TEV = ${exitMultiple} × that = $${exitTev}; with debt unchanged at $${debt}, exit equity = $${exitEquity}. MOIC = $${exitEquity} ÷ $${equityIn} = ${moic}x; IRR ≈ ${moic}^(1/${years}) − 1 = ${irr}%.`,
  };
}

export const DRILL_GENERATORS: Record<DrillKind, (rng: Rng) => Drill> = {
  "three-statement": generateThreeStatement,
  tsm: generateTsm,
  "accretion-dilution": generateAccretionDilution,
  "paper-lbo": generatePaperLbo,
};

export const DRILL_META: Record<DrillKind, { title: string; topic: string; blurb: string }> = {
  "three-statement": {
    title: "3-Statement Change",
    topic: "accounting",
    blurb: "A random line item moves — walk all three statements to the change in net income and cash.",
  },
  tsm: {
    title: "Treasury Stock Method",
    topic: "ev-equity-value",
    blurb: "Compute a diluted share count from options and price.",
  },
  "accretion-dilution": {
    title: "Accretion / Dilution",
    topic: "ma",
    blurb: "Call an all-stock deal accretive or dilutive and size the EPS impact.",
  },
  "paper-lbo": {
    title: "Paper LBO",
    topic: "lbo",
    blurb: "Estimate MOIC and IRR in your head from entry, leverage, growth, and exit.",
  },
};
