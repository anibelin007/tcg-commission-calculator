# Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Repositories, documentation of rules, decisions and open questions (this PR). | In progress |
| 1 | Base commission: automatic level, CT + TT commission with the strongest-team limit, all markets and plans (eu, mx, usa), payout reminder, manual input, simulations (next level, target amount, step chart). Uses `@anibelin007/tcg-ui`. | Next |
| 2 | Fast Track (EU/MX, new partners registered with the Starterset Business Booster, months 1–8, two wildcards) and Start Bonus (USA). Input design still open: the bonus depends on the partner's history. | Not started |
| 3 | Growth Bonus (level 6+, NPV) and Beyond Target 10 (TT-5, NPV-5). Needs downline data at level 6+. | Not started |
| — | Import from RINGANA (current and previous month). Depends on Q-03 and D-010. | Pending decision |

## Phase 1 order of work

1. `tcg-ui`: tokens, base styles, language selector and i18n setup, private publishing.
2. Engine in `src/domain/commission/` (pure TypeScript, plans as versioned data, table-driven
   tests from `docs/qa/test-cases.md`).
3. Manual input form and result breakdown.
4. Simulations (PF-02 to PF-04).
