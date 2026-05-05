## Summary
<!-- 1–3 bullets on what changed and why -->

## Type of change
- [ ] Bug fix
- [ ] New feature (existing infrastructure)
- [ ] Refactor / cleanup
- [ ] Tests / DX / CI
- [ ] Docs

## Test plan
- [ ] `pnpm test:unit`
- [ ] `pnpm test:int`
- [ ] `pnpm test:e2e` (or `pnpm test:e2e:live` if hitting AI APIs is necessary)
- [ ] Manual smoke in dev: `pnpm dev` and exercise the affected flow

## Cost / risk
<!-- Does this add a paid AI call? A new external dependency? PII surface? -->

## Deploy
<!-- Merging to `main` triggers Vercel auto-deploy via the Vercel GitHub app. -->

## Checklist
- [ ] Auth-gated any new API route
- [ ] Validated request body with Zod
- [ ] Wrapped any user-supplied AI prompt input via `wrapUserText`
- [ ] Added unit and/or integration test coverage

🤖 Generated with [Claude Code](https://claude.com/claude-code)
