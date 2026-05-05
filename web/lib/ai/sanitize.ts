/**
 * Wrap untrusted user-supplied text inside a tagged delimiter so the model
 * treats it as data, not instructions. Inspired by Anthropic's prompt-injection
 * mitigation guidance.
 *
 * - Replaces any literal occurrence of the wrapping tags inside the text to
 *   prevent breakout (e.g., user pastes "</user_input>...").
 * - Caps input length to defuse token-flooding cost attacks.
 *
 * Why a tag and not just quotes: triple-quoted blocks were the previous
 * pattern (e.g. `"""${body.bio}"""`) but a malicious user could inject
 * `"""` in their bio to terminate the block early and inject instructions.
 */
export function wrapUserText(
  text: string | null | undefined,
  tag: string,
  opts: { maxChars?: number } = {},
): string {
  if (!text) return "";
  const maxChars = opts.maxChars ?? 12_000;
  const truncated = text.length > maxChars ? text.slice(0, maxChars) + "…[truncated]" : text;
  // Strip both the open and close tag forms; user CANNOT close our wrapper.
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const safe = truncated.split(open).join(`<${tag}_>`).split(close).join(`</${tag}_>`);
  return `${open}\n${safe}\n${close}`;
}

/**
 * Hard-cap any free-text field destined for an AI prompt. Use for fields
 * that don't need delimiter wrapping (e.g., a name, a firm).
 */
export function capText(text: string | null | undefined, maxChars: number): string {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}
