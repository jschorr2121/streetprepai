/**
 * Shared Supabase fluent-builder mock helper for lib/data tests.
 *
 * Usage in a test file:
 *
 *   import { vi } from "vitest";
 *   import { buildSupabaseMockGraph } from "./_supabase-mock";
 *
 *   const sb = vi.hoisted(() => buildSupabaseMockGraph());
 *   vi.mock("@/lib/supabase/server", () => ({ createClient: sb.createClient }));
 *
 *   beforeEach(() => sb.reset());
 *
 * The chain is fully fluent: select/eq/is/order/limit all return the same proxy.
 * Awaiting the chain yields `{ data: rows, error }`. `single` / `maybeSingle`
 * yield `{ data: rows[0] ?? null, error }`.
 */
import { vi } from "vitest";

type Mock = ReturnType<typeof vi.fn>;

export interface SupabaseMockGraph {
  setRows: (rows: unknown[], error?: unknown) => void;
  reset: () => void;
  createClient: Mock;
  from: Mock;
  select: Mock;
  insert: Mock;
  update: Mock;
  upsert: Mock;
  delete: Mock;
  eq: Mock;
  is: Mock;
  order: Mock;
  limit: Mock;
  single: Mock;
  maybeSingle: Mock;
}

export function buildSupabaseMockGraph(): SupabaseMockGraph {
  const state = { rows: [] as unknown[], error: null as unknown };

  const single = vi.fn(() => Promise.resolve({ data: state.rows[0] ?? null, error: state.error }));
  const maybeSingle = vi.fn(() =>
    Promise.resolve({ data: state.rows[0] ?? null, error: state.error }),
  );

  const chain: Record<string, unknown> = {};
  const select = vi.fn(() => chain);
  const eq = vi.fn(() => chain);
  const is = vi.fn(() => chain);
  const order = vi.fn(() => chain);
  const limit = vi.fn(() => chain);
  chain.select = select;
  chain.eq = eq;
  chain.is = is;
  chain.order = order;
  chain.limit = limit;
  chain.single = single;
  chain.maybeSingle = maybeSingle;
  chain.then = (resolve: (v: { data: unknown[]; error: unknown }) => unknown) =>
    resolve({ data: state.rows, error: state.error });

  const insert = vi.fn(() => chain);
  const update = vi.fn(() => chain);
  const upsert = vi.fn(() => chain);
  const del = vi.fn(() => chain);

  const from = vi.fn((_table: string) => ({
    select,
    insert,
    update,
    upsert,
    delete: del,
  }));

  const createClient = vi.fn(async () => ({ from }));

  return {
    setRows: (rows, error = null) => {
      state.rows = rows;
      state.error = error;
    },
    reset: () => {
      state.rows = [];
      state.error = null;
      from.mockClear();
      select.mockClear();
      insert.mockClear();
      update.mockClear();
      upsert.mockClear();
      del.mockClear();
      eq.mockClear();
      is.mockClear();
      order.mockClear();
      limit.mockClear();
      single.mockClear();
      maybeSingle.mockClear();
      createClient.mockClear();
    },
    createClient,
    from,
    select,
    insert,
    update,
    upsert,
    delete: del,
    eq,
    is,
    order,
    limit,
    single,
    maybeSingle,
  };
}
