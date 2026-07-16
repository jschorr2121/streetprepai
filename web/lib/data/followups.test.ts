import { describe, expect, it } from "vitest";

import { followupDueDate } from "./followups";

const NOW = new Date("2026-07-16T12:00:00Z");

describe("followupDueDate", () => {
  it("passes a valid ISO date through", () => {
    expect(followupDueDate("2026-08-01", NOW)).toBe("2026-08-01");
  });

  it("truncates a full ISO timestamp to the date", () => {
    expect(followupDueDate("2026-08-01T09:30:00Z", NOW)).toBe("2026-08-01");
  });

  it.each(["next week", "Friday", "08/01/2026", "2026-13-45", ""])(
    "defaults %j to three days out",
    (input) => {
      expect(followupDueDate(input, NOW)).toBe("2026-07-19");
    },
  );

  it("defaults undefined to three days out", () => {
    expect(followupDueDate(undefined, NOW)).toBe("2026-07-19");
  });
});
