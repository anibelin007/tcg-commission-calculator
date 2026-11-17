# Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Repositories, documentation of rules, decisions and open questions. | Done |
| 1 | Base commission: automatic level, CT + TT commission with the strongest-team limit, all markets and plans (eu, mx, usa), payout reminder, manual input, simulations (next level, target amount, step chart). Uses `@anibelin007/tcg-ui`. | In progress |
| 1.5 | Three tabs (D-019) and reverse-engineering scenarios (D-021): PR A tabs and shared data (#7), PR B scenario engine (#8), PR C tab 3 UI. | Finishing (PR C) |
| 2 | Fast Track (EU/MX, new partners registered with the Starterset Business Booster, months 1–8, two wildcards) and Start Bonus (USA). Input design still open: the bonus depends on the partner's history. | Not started |
| 3 | Growth Bonus (level 6+, NPV) and Beyond Target 10 (TT-5, NPV-5). Needs downline data at level 6+. | Not started |
| 4 | Prospect simulator with fictitious orders (PF-06, D-017): products × quantity → points via the market's points table. | Proposed |
| — | Import from RINGANA (current and previous month) with the partner's own session, token in `sessionStorage` (D-018). | Accepted direction; prerequisites Q-17 to Q-19 |

## Phase 1 order of work

1. ✅ `tcg-ui`: tokens, base styles, language selector and i18n setup, private publishing (0.1.0).
2. ✅ App shell (header, language selector, 7 locales) and engine in `src/domain/commission/` (pure TypeScript, plans as versioned data, table-driven
   tests from `docs/qa/test-cases.md`).
3. ✅ Manual input form (market, own points, teams by generation) and result breakdown.
4. ✅ Simulations (PF-02 to PF-04): next level, target amount, step chart.
