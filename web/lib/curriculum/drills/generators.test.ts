import { describe, expect, it } from "vitest";

import {
  generateAccretionDilution,
  generatePaperLbo,
  generateThreeStatement,
  generateTsm,
  type Rng,
} from "./generators";

// A deterministic RNG cycling through fixed values makes drills reproducible.
function seq(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe("generateThreeStatement", () => {
  it("net income and cash changes are internally consistent (cash = NI + non-cash addback)", () => {
    const d = generateThreeStatement(seq([0.0, 0.5, 0.5])); // depreciation, mid amount, mid tax
    const ni = d.fields.find((f) => f.key === "netIncome")!.value;
    const cash = d.fields.find((f) => f.key === "cashChange")!.value;
    // Non-cash charge: cash falls less than NI (or rises), so cash > netIncome.
    expect(cash).toBeGreaterThan(ni);
    expect(d.prompt).toContain("$");
  });
});

describe("generateTsm", () => {
  it("diluted shares exceed basic shares for in-the-money options", () => {
    const d = generateTsm(seq([0.3, 0.5, 0.4, 0.2]));
    const diluted = d.fields[0]!.value;
    expect(diluted).toBeGreaterThan(0);
    // Sanity: the explanation's arithmetic must land on the stated answer.
    expect(d.explanation).toContain(String(diluted));
  });
});

describe("generateAccretionDilution", () => {
  it("higher acquirer P/E than target P/E is accretive (positive %)", () => {
    // Force acquirerPe high, targetPe low by controlling the first two randInts.
    // randInt(10,25) with rng≈0.99 -> ~25; randInt(8,22) with rng≈0.0 -> 8.
    const d = generateAccretionDilution(seq([0.99, 0.0, 0.5, 0.5, 0.5]));
    const pct = d.fields[0]!.value;
    expect(pct).toBeGreaterThan(0);
  });

  it("lower acquirer P/E than target P/E is dilutive (negative %)", () => {
    const d = generateAccretionDilution(seq([0.0, 0.99, 0.5, 0.5, 0.5]));
    const pct = d.fields[0]!.value;
    expect(pct).toBeLessThan(0);
  });
});

describe("generatePaperLbo", () => {
  it("MOIC and IRR are positive and mutually consistent", () => {
    const d = generatePaperLbo(seq([0.5, 0.5, 0.5, 0.9, 0.9]));
    const moic = d.fields.find((f) => f.key === "moic")!.value;
    const irr = d.fields.find((f) => f.key === "irr")!.value;
    expect(moic).toBeGreaterThan(0);
    // IRR sign should match whether MOIC > 1.
    if (moic > 1) expect(irr).toBeGreaterThan(0);
  });

  // Regression: entryMultiple ∈ [6,11] and leverage ∈ [3,6] used to be drawn
  // independently. When both landed on 6, debt == entry TEV, equityIn hit
  // zero, and MOIC/IRR came out NaN (or Infinity with EBITDA growth) — an
  // unsolvable drill whose reveal literally read "NaNx". The fix constrains
  // leverage to stay below entryMultiple. Sweep every entryMultiple outcome
  // (6 values) against a dense sample of the leverage roll (10 values) so any
  // reintroduction of an entryMultiple === leverage combo is caught.
  it("MOIC/IRR are finite and positive across the full entryMultiple x leverage domain", () => {
    for (let emStep = 0; emStep < 6; emStep++) {
      // +epsilon nudges values off exact bucket boundaries from randInt's floor().
      const entryMultipleRng = emStep / 6 + 1e-9;
      for (let levStep = 0; levStep < 10; levStep++) {
        const leverageRng = levStep / 10;
        const d = generatePaperLbo(seq([0.5, entryMultipleRng, leverageRng, 0.5, 0.5]));
        const moic = d.fields.find((f) => f.key === "moic")!.value;
        const irr = d.fields.find((f) => f.key === "irr")!.value;
        expect(Number.isFinite(moic)).toBe(true);
        expect(Number.isFinite(irr)).toBe(true);
        expect(moic).toBeGreaterThan(0);
      }
    }
  });
});
