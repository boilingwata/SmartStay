# Phase 17: Frontend Dashboard Refinement - Discussion Log

> Audit trail only. Do not use as input to planning, research, or execution agents.
> Decisions are captured in `17-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 17-frontend-dashboard-refinement
**Mode:** `$gsd-discuss-phase 17 --batch`
**Note:** `gsd-sdk query init.phase-op 17` reported `phase_found: false` because `.planning/ROADMAP.md` is not present. User explicitly required creating `CONTEXT.md` on the first run, so context was created in a new phase directory without mutating roadmap/state directly.

---

## Source Input

The user requested frontend refinement for:

- `assets`
- `amenities`
- `tenants`
- `contracts`
- `addendums`
- `utility-billing`
- `billing-runs`
- `services`
- `utility-policies`
- `utility-overrides`
- `invoices`
- `payments`
- `tickets`

The requested direction was:

- Dashboard SaaS production.
- Simple, easy to use, clear, responsive, stable layout.
- Suitable for older users and non-technical users.
- 100% proper Vietnamese with full accents.
- Vietnamese date/time formatting.
- Technical/service/Supabase values translated into user-friendly Vietnamese.
- No landing page, no marketing layout.
- Fast scanning and fast operations.
- Add missing SaaS dashboard UX standards to scope.

---

## Areas Discussed

## Language and Formatting

| Option | Description | Selected |
|--------|-------------|----------|
| Strict Vietnamese UI | All visible user text in Vietnamese, full accents, no raw enums | Yes |
| Mixed technical labels | Keep English/technical values where already present | No |
| Agent discretion | Let executor choose case by case | No |

**Captured decision:** Strict Vietnamese UI is mandatory across scope. Date/time/money/status labels must use Vietnamese conventions.

## Layout and Responsiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Fluid dashboard width | Avoid fixed 1200px content; use larger max width only if useful | Yes |
| Existing container behavior | Keep current width constraints unless visibly broken | No |
| Mobile-only responsive pass | Focus only on small screens | No |

**Captured decision:** Layout must pass real viewport breakpoints `1920`, `1600`, `1440`, `1366`, `1280`, `1024`, `768`, `390`; no browser zoom workaround.

## Dashboard UX Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Operational SaaS dashboard | Dense enough to scan, restrained, direct, task-focused | Yes |
| Marketing/product page | Hero sections, decorative cards, promotional layout | No |
| Highly custom UI | Novel interactions per module | No |

**Captured decision:** Use familiar dashboard patterns: tables, compact cards, filters, tabs, modals, badges, clear action groups.

## Module Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Polish existing admin modules | Improve current list/detail/modal/filter/table UX | Yes |
| Add new business capabilities | New payment gateway, approval, signing, automation flows | No |
| Full architecture refactor | Move all domains into feature-first architecture | No |

**Captured decision:** Phase is frontend polish and responsive hardening for existing admin/owner modules only.

## Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Build/lint plus manual breakpoint QA | Use `npm run build`, `npm run lint`, and viewport checklist | Yes |
| Visual review only | Rely on screenshots without build/lint | No |
| Unit tests only | Treat unit tests as sufficient for layout work | No |

**Captured decision:** Verification requires build, lint, and manual responsive review across the requested breakpoints.

---

## Agent Discretion

- Exact component extraction strategy.
- Which modules are implemented in which wave.
- Whether to use compact table, card, split workspace, tab, modal or sheet per screen.
- Whether to add shared presentation helpers when existing helpers are insufficient.

## Deferred Ideas

- Full feature-first architecture migration.
- New backend/schema work not required by UI correctness.
- New business workflows outside current module behavior.
