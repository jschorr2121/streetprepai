/**
 * Test/runtime-safe wrappers around Next 15's caching primitives.
 *
 * `unstable_cache` and `revalidateTag` both rely on Next's async-storage
 * "work store". When called outside a Next request (e.g. from Vitest, or a
 * one-off Node script), they throw "Invariant: incrementalCache missing" /
 * "static generation store missing". To keep `lib/data/*` unit tests
 * (which import the real module and mock Supabase underneath) working
 * without per-test cache plumbing, we transparently fall back to the raw
 * function in non-request contexts.
 *
 * In a real Next request these wrappers behave identically to the underlying
 * Next APIs.
 */
import { unstable_cache, revalidateTag } from "next/cache";

const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

type AnyAsyncFn<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

/**
 * Wrap a server-side data-loader in `unstable_cache` with the given tags and
 * revalidate window. In test mode (`NODE_ENV=test` or `VITEST=true`) returns
 * the function unwrapped, so unit tests that mock Supabase still hit the
 * real implementation on every call.
 */
export function cached<TArgs extends unknown[], TResult>(
  fn: AnyAsyncFn<TArgs, TResult>,
  keyParts: string[],
  options: { tags: string[]; revalidate: number },
): AnyAsyncFn<TArgs, TResult> {
  if (isTestEnv) return fn;
  return unstable_cache(fn, keyParts, options) as AnyAsyncFn<TArgs, TResult>;
}

/**
 * `revalidateTag` that no-ops when invoked outside a Next request context.
 *
 * Calling Next's `revalidateTag` from a Vitest test (which exercises the data
 * layer end-to-end against a mocked Supabase) would otherwise throw an
 * "Invariant: static generation store missing" error.
 */
export function safeRevalidateTag(tag: string): void {
  if (isTestEnv) return;
  try {
    revalidateTag(tag, "max");
  } catch {
    // Outside a Next request store (e.g. seed scripts) revalidateTag throws.
    // Swallow — there is nothing to revalidate in those contexts.
  }
}
