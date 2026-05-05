import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/**
 * Returns an Upstash Redis client, or null when env is not configured.
 * Callers MUST handle the null case (rate-limit falls back to in-memory).
 */
export function getRedis(): Redis | null {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}
