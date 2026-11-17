# CLAUDE.md

Permanent guide for Claude Code sessions in this repository. Keep it short; details live in
`docs/`.

## Project Overview

Unofficial **commission calculator for TCG partners** (*socias*), based on the RINGANA target
plan. Any partner, in any market, can estimate her commission for the current month, see what
she needs for the next target level and how many points she would need for a target amount.

- Current phase: **phase 0 → phase 1 (base commission only)**. See
  [`docs/plan/roadmap.md`](docs/plan/roadmap.md).
- **Source of truth: the RINGANA commission guidelines** (D-001). The team Google Sheet is
  not a reference. Source inventory: [`docs/sources/README.md`](docs/sources/README.md).
- Reached from the team website via link; it is a standalone app.
- Sibling repos: `tcg-ui` (shared design system), `tcg-skin-test`.

## Commission Rules

- Rules: [`docs/functional/business-rules.md`](docs/functional/business-rules.md).
  Never change a rule (rates, minima, limits, factors, thresholds) without explicit approval.
- Every rule cites document, version and printed page, and is tagged: Verified rule /
  Observed behaviour / Inference / Pending verification / Provisional decision / Proposed
  improvement.
- Do not invent expected results. Test values come from the guidelines or are derived from
  verified rules (`docs/qa/test-cases.md`).
- Provisional decisions (e.g. D-005: strongest-team limit not applied for now) are implemented
  as replaceable strategies and revisited when evidence arrives.
- RINGANA PDFs are not committed (D-011).
- Plans are versioned data (`eu`, `mx`, `usa`); markets carry factor, currency and payout
  threshold. Market is independent from the UI language.

## What the Tool May Say (GC Rules)

- Every result is an **estimate**; the official settlement is RINGANA's.
- Simulations say «you would need X points», never «you will earn» (earnings claims, BR-21).
- No RINGANA logos or trade dress; TCG identity only (BR-22).

## Technology

- Stack (D-014, accepted): React, TypeScript (strict), Vite, Tailwind CSS v4, Vitest, oxlint,
  GitHub Actions — same as `tcg-skin-test`. Shared UI from `@anibelin007/tcg-ui`.
- **Not decided — do not choose or configure:** backend, final hosting. A temporary public
  preview runs on GitHub Pages (D-022).
- **Nothing leaves the browser** (D-007): the real form data and the RINGANA session token
  (D-018) live only in `sessionStorage` of the tab; scenarios are never stored. Never store or
  log passwords. The RINGANA import uses only `/teams/generations` and `/teams/revenue`.

## Architecture Principles

- `src/domain/commission/`: pure rules, no I/O, no React, no i18n. Plans as data.
- One page, three tabs synced with the URL hash (D-019): `src/features/current/`,
  `src/features/next-level/`, `src/features/target/`. Shared real data in `src/state/`
  (`usePartnerData()`); scenarios are separate and never modify it. Shared form components in
  `src/components/`. Design: `docs/architecture/three-tabs-design.md`.
- `src/i18n/`: app-specific texts (shared setup in `tcg-ui`).
- Business logic uses stable IDs; translated labels never drive rules.
- Use `tcg-*` design tokens; never hard-code colours or user-facing text.

## Git Workflow

- GitHub Flow: `main` + short-lived branches (`docs/`, `feature/`, `fix/`, `test/`,
  `refactor/`, `chore/`). Conventional Commits in English.
- Open a PR with the template. **Never merge** — the product owner merges.

## Coding Standards

- English for code, identifiers, comments and technical docs.
- TypeScript strict; no `any` without justification; pure functions; named exports.
- Tests next to code as `*.test.ts(x)`; table-driven from `docs/qa/test-cases.md`.

## Security and Privacy

- No secrets, tokens or credentials in the repo (the GitHub Packages token lives in the
  user's `~/.npmrc` or in CI secrets).
- No real personal data in tests, fixtures, docs or logs. Real Billing Documents are reduced
  to anonymous numbers before anything is committed.

## Collaboration Rules

- Claude may do autonomously: documentation, tests, approved technical tasks, refactors
  without behaviour change, branches, commits, pushes to working branches, opening PRs.
- Requires product-owner approval: changing rules, new features, backend/hosting/auth,
  significant dependencies, merging into `main`.
- Communicate with the product owner in Spanish; write repository content in English.

## Definition of Done

- Scope matches the request; no unapproved rule changes.
- `npm run check` passes locally and in CI (once the app exists).
- Tests cover the change; expected values cite their source.
- Docs, decision log and open questions updated.
- No secrets or personal data; PR opened with the template filled in.
