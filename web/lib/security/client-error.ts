// Client-safe error reporting for Route Handlers. Raw error text from upstream
// SDKs, parsers, or Postgres can leak hostnames, request internals, or schema
// details — log the real error server-side and hand the client a stable,
// display-safe message instead.
export function clientSafeError(route: string, err: unknown, publicMessage: string): string {
  console.error(`[${route}]`, err);
  return publicMessage;
}
