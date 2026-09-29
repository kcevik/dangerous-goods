# Docs index

| File | What it is |
|---|---|
| [`STATUS.md`](STATUS.md) | **Start here.** Feature status, next steps, go-live blockers, parked items |
| [`database-schema-and-import-plan.md`](database-schema-and-import-plan.md) | Table definitions and the BAM import |
| [`schema-diagram.html`](schema-diagram.html) | ER diagram of the regulation tables (open in a browser). Predates the auth work: it still shows the dropped `un_comparison` view and lacks `profiles` / `launch_signups` |
| [`go-live-readiness-2026-09-28.md`](go-live-readiness-2026-09-28.md) | Historical snapshot of 2026-09-28; its open points now live in `STATUS.md` |
| `deploy/` | Server runbook and concepts (created by the deployment plan, Task 8) |

## Designs and plans

Each feature is designed in a spec (`superpowers/specs/`) and built from a plan
(`superpowers/plans/`) with the same date and name. Plans that were executed carry an
"Execution notes" section with the decisions taken during the build.

| Date | Topic | Status | Spec | Plan |
|---|---|---|---|---|
| 2026-07-28 | Search | ✅ done (ported to SvelteKit) | [spec](superpowers/specs/2026-07-28-search-design.md) | [plan](superpowers/plans/2026-07-28-search.md) |
| 2026-07-28 | Landing, waitlist, SEO | ⛔ superseded — the waitlist was retired on 2026-09-04 and replaced by the pre-launch list of 2026-09-29; the SEO parts are live | [spec](superpowers/specs/2026-07-28-landing-waitlist-seo-design.md) | [plan](superpowers/plans/2026-07-28-landing-waitlist-seo.md) |
| 2026-09-04 | SvelteKit rewrite (from Nuxt 4) | ✅ done | [spec](superpowers/specs/2026-09-04-sveltekit-rewrite-design.md) | [plan](superpowers/plans/2026-09-04-sveltekit-rewrite.md) |
| 2026-09-04 | Auth and entitlement | ✅ done (dashboard setup §6 done 2026-09-29, SMTP open) | [spec](superpowers/specs/2026-09-04-auth-and-entitlement-design.md) | [plan](superpowers/plans/2026-09-04-auth-and-entitlement.md) |
| 2026-09-28 | ADR book viewer | 🟡 code complete; deploy gated on the source document | [spec](superpowers/specs/2026-09-28-adr-book-viewer-design.md) | [plan](superpowers/plans/2026-09-28-adr-book-viewer.md) |
| 2026-09-28 | Regulatory comparison (F-10) | ⚪ planned, not started | [spec](superpowers/specs/2026-09-28-regulatory-comparison-design.md) | [plan](superpowers/plans/2026-09-28-regulatory-comparison.md) |
| 2026-09-29 | Pre-launch mode + test deployment | 🟡 Tasks 1–7 of 11 done | [spec](superpowers/specs/2026-09-29-prelaunch-deployment-design.md) | [plan](superpowers/plans/2026-09-29-prelaunch-deployment.md) |

## How we work

brainstorming → spec in `superpowers/specs/` → plan in `superpowers/plans/` → test-first
implementation (`pnpm test` per task) → Svelte MCP autofixer on every `.svelte`/`.svelte.ts` →
`pnpm check` → `pnpm build` + smoke test → update `STATUS.md`. The owner commits.
