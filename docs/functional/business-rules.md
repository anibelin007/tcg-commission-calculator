# Business rules — phase 1 (base commission)

Scope of phase 1 (decision D-004): **base commission only**: customer-turnover commission +
team-turnover commission, converted to the local currency. Bonuses (Fast Track, Start Bonus,
Growth Bonus, Beyond Target 10) are out of scope (phases 2–3, see `docs/plan/roadmap.md`).

Evidence tags and source IDs: [`docs/sources/README.md`](../sources/README.md).
Citations are printed page numbers. *EU-ES* = S-01, *EU-EN* = S-02 (en), *MX* = S-03,
*USA* = S-04, *GC* = S-05.

Domain IDs (language-independent, used in code): target levels `1`–`10`; plans `eu`, `mx`, `usa`.

## Terminology

| ID | Guideline term (ES) | EN | USA | Meaning |
|---|---|---|---|---|
| `ct` | VC — volumen de ventas a clientes | CT — customer turnover | CT | Points of paid customer orders in the statement month. In EU/MX it includes the partner's own orders (EU-ES p. 8 example). |
| `pt` | — | — | PT — personal turnover | USA only: points of the partner's own paid purchases (USA p. 7–8). |
| `dt` | — | — | DT — direct turnover = CT + PT | USA only (USA p. 7–8). |
| `tt` | VE — volumen de ventas de equipo | TT — team turnover | TT | Own volume + volume of **all** downline generations (EU-ES p. 9). |
| `tt1`–`tt3` | VE-1, VE-2, VE-3 | TT-1… | TT-1… | TT minus the volume of the 1, 2 or 3 strongest teams (EU-ES p. 10). |
| team / *pata* | equipo | team | team | One first-generation partner plus their whole downline (EU-ES p. 12). The team's volume is that partner's TT. |
| generation | generación | generation | generation | Depth below the partner: gen 1 = direct partners, gen 2 = their partners, … (EU-ES p. 12). |

## Rules

### Points and period

- **BR-01 Points.** Every product has a points value; commissions are computed on points.
  Some products (digital vouchers, merchandise) have none. — *Verified rule* (EU-ES p. 7).
  Points have two decimals (S-07) — inputs must accept decimals. — *Verified rule*.
- **BR-02 Promotional products.** Their points are reduced in proportion to the discount and
  90 % of the result counts for commission. — *Verified rule* (EU-ES p. 7, footnote).
  Phase 1 takes points as already computed by RINGANA, so this rule is not applied by the
  calculator. — *Inference*.
- **BR-03 Statement month.** One calendar month, closing on the last day at 23:59 CET; only
  sales paid by then count. — *Verified rule* (EU-ES p. 31–32).

### Volumes (EU and MX)

- **BR-23 New partners.** A partner registered in month M is not settled in M: her first
  statement is M+1 and includes her points of M and M+1. In M her points do not count for the
  upline yet: the Online Office reports her with `isNewPartner: true` / `deducted: false`, she
  is not counted in generation 1 and adds nothing to the upline's TT. — *Observed behaviour*
  (S-14, 2026-11-17) and PO statement; consistent with EU-ES p. 31 (first commission with the
  first full statement month). In M+1 her points of M **and** M+1 count for her upline's TT
  and commission. The grace month lets new partners learn and treats a partner who joins on the
  1st and one who joins on the 20th alike. — PO statement 2026-11-17 (Q-20).

- **BR-04 CT** = sum of points of paid customer orders in the month, including the partner's
  own orders. — *Verified rule* (EU-ES p. 8: 900 customers + 100 own = CT 1,000)
  The Online Office «VC» column already includes own consumption (shown separately as a
  breakdown). — *Observed behaviour* (S-13; PO confirmation 2026-11-17, Q-16).
- **BR-05 TT** = own CT + CT of all downline partners, **all generations** (not limited to 9).
  — *Verified rule* (EU-ES p. 9: example TT 4,500).
- **BR-06 TT-n** = own volume + the TT of every team **except** the *n* strongest: the
  strongest teams are not added, so TT-n is never below the own volume. The strongest team is
  the one with the highest volume. — *Verified rule* (EU-ES p. 10: example TT-1 = 2,700 =
  own 1,000 + team 1 1,700). Calculator: downline volume not in any listed team also counts;
  if teams add up to more than the generations, the larger total is used and a warning is
  shown (PO, 2026-11-17).
- **BR-07 Qualification minima.** — *Verified rule* (EU-ES p. 5–6; MX p. 5–6 identical).

  | Level | Criteria |
  |---|---|
  | 1 | CT ≥ 110 |
  | 2 | (CT ≥ 220 **and** TT ≥ 1,000) **or** CT ≥ 385 |
  | 3 | (CT ≥ 330 **and** TT-1 ≥ 1,600) **or** CT ≥ 825 |
  | 4 | CT ≥ 440 **and** TT-1 ≥ 3,200 |
  | 5 | CT ≥ 550 **and** TT-2 ≥ 4,000 |
  | 6 | CT ≥ 660 **and** TT-2 ≥ 8,000 |
  | 7 | CT ≥ 660 **and** TT-2 ≥ 15,000 |
  | 8 | CT ≥ 660 **and** TT-3 ≥ 20,000 |
  | 9 | CT ≥ 660 **and** TT-3 ≥ 40,000 |
  | 10 | CT ≥ 660 **and** TT-3 ≥ 60,000 |

- **BR-08 Attained level** = the highest level whose criteria are met. — *Inference* (the
  guideline speaks of «la meta que consigas»; the criteria are monotonic, so meeting a level
  implies meeting all lower ones).
- **BR-09 Activity.** Below level 1 (CT < 110) there is no commission. — *Verified rule*
  (EU-ES p. 34).

### Commission (EU and MX)

- **BR-10 CT commission rate**: level 1 = 19 %, level 2 = 29 %, levels 3–10 = 39 %.
  — *Verified rule* (EU-ES p. 5–6, p. 11).
- **BR-11 TT commission rates by generation.** — *Verified rule* (EU-ES p. 5–6).

  | Gen | L1 | L2 | L3 | L4 | L5 | L6–L10 |
  |---|---|---|---|---|---|---|
  | 1 | 8 % | 8 % | 8 % | 9 % | 9 % | 9 % |
  | 2 | 2 % | 4 % | 9 % | 14 % | 14 % | 14 % |
  | 3 | — | 3 % | 4 % | 5 % | 6 % | 6 % |
  | 4 | — | — | 2 % | 3 % | 4 % | 4 % |
  | 5 | — | — | — | 2 % | 2 % | 2 % |
  | 6 | — | — | — | — | 1 % | 2 % |
  | 7–9 | — | — | — | — | — | 1 % |

  Generations beyond 9 never earn commission (EU-ES p. 13: «hasta generación 9 como máximo»),
  but they still count for TT (BR-05).
- **BR-12 Limit for the strongest team** («límite de puntos comisionables por el equipo con
  mayor volumen»): L1 500 · L2 1,000 · L3 1,500 · L4 2,000 · L5 3,000 · L6 4,500 · L7 7,000 ·
  L8–L10 none. — *Verified rule* (EU-ES p. 5–6, p. 11).
  **How it is applied is Pending verification** (Q-01). Phase 1 uses:
  - **BR-12 default** — *Provisional decision* (PO, 2026-11-17, D-005): the limit is **not
    applied** until the rule is confirmed; the result only notes when the strongest team's TT
    exceeds it.
  - **BR-12a** — Alternative reading (PO, 2026-11-15, formerly the default): the limit is
    compared with the **TT of the strongest team** (all its generations). If the team's TT
    exceeds the limit, the commission earned from that team is reduced.
  - **BR-12b** — For BR-12a, the reduction is **proportional**:
    `teamCommission × limit / teamTT`. Alternative still open: apply the limit from
    generation 1 downwards.
  - BR-12a contradicts the worked example in EU-ES p. 15 (strongest team TT 1,800 > 1,500
    at level 3, no reduction shown, total 909.48 €). See Q-01 and test case TC-02.
- **BR-13 Base commission** = (CT commission + TT commission) in points × points factor of
  the market. — *Verified rule* (EU-ES p. 13).
- **BR-14 Points factors** (valid from February 2026 until revoked). — *Verified rule*
  (EU-ES p. 13; MX p. 13–14; PER, COL, ARG p. 13–14; USA p. 13–14). The Peru, Colombia
  and Argentina guidelines have the same target plan as EU/MX (p. 5–6).

  | Plan | Market / contract | Factor | Currency |
  |---|---|---|---|
  | eu | Standard (all EU markets not listed) | 1.32 | EUR |
  | eu | France — VDI | 1.216 | EUR |
  | eu | France — Mandataire Professionnel | 1.32 | EUR |
  | eu | Italy — Porta a Porta Occasionale | 1.32 | EUR |
  | eu | Italy — Porta a Porta incl. partita IVA | 1.251 | EUR |
  | eu | Switzerland — all | 1.2 | CHF |
  | eu | Sweden — all | 14.72 | SEK |
  | eu | Denmark — all | 9.65 | DKK |
  | eu | United Kingdom — all | 1.107 | GBP |
  | eu | Poland — all | 5.59 | PLN |
  | eu | Czech Republic — all | 32.5 | CZK |
  | eu | Hungary — all | 540 | HUF |
  | mx | Mexico | 26 | MXN |
  | pe | Peru | 5.2 | PEN |
  | co | Colombia | 6,240 | COP |
  | ar | Argentina (valid from June 2026) | 2,210 | ARS |
  | usa | USA (valid from October 2026) | 1.6 | USD |

- **BR-15 Tax-specific settlements.** Partners with a billing address in France, Italy,
  Switzerland, Mexico, Peru, Colombia or Argentina receive an additional settlement document with the final amount for
  tax/contract reasons. — *Verified rule* (EU-ES p. 13, p. 35; PER, COL, ARG p. 35–36). The calculator shows the
  base commission and must say that the final amount may differ in those markets.
  — *Proposed improvement* (wording to be approved).
- **BR-16 Payout threshold.** Commissions **above** the threshold are transferred; otherwise
  they are paid as a webshop voucher (valid three years). — *Verified rule*.

  | Plan | Threshold | Source |
  |---|---|---|
  | eu (EUR) | > 65 € | EU-ES p. 34 |
  | mx | > 1,700 MXN | MX p. 33–34; EU-EN p. 34 («MXN 1,700 or € 89») |
  | usa | > 65 $ | USA p. 31–32 |
  | eu, non-EUR currencies | **Pending verification** (Q-04) | — |
  | pe, co, ar | None documented: the guidelines describe no voucher threshold | PER, COL, ARG p. 33–34 |

  The tool shows a reminder when the estimate is not above the threshold (D-008).
- **BR-17 Rounding.** The guideline examples show final amounts with two decimals
  (514.80 €, 909.48 €). Intermediate rounding is not documented. — *Pending verification*
  (Q-05). Provisional: no intermediate rounding; round the final amount to the currency's
  minor unit.

### USA plan differences (plan `usa`)

- **BR-18** — *Verified rule* (USA p. 5–10, p. 13–14):
  - Volumes use **DT** (CT + own purchases) instead of CT; TT and TT-n are built from DT.
  - CT/TT-n rates, generation rates and limits are the same as EU (BR-10 to BR-12).
  - Levels 1–3 qualify on DT: L1 DT ≥ 110; L2 (DT ≥ 220 and TT ≥ 1,000) or DT ≥ 385;
    L3 (DT ≥ 330 and TT-1 ≥ 1,600) or DT ≥ 825.
  - Levels 4–10 require **CT ≥ 330** (customer turnover only) plus the same TT-n minima as EU
    (L4 TT-1 3,200 · L5 TT-2 4,000 · L6 TT-2 8,000 · L7 TT-2 15,000 · L8 TT-3 20,000 ·
    L9 TT-3 40,000 · L10 TT-3 60,000).
  - Activity: level 1 = 110 DT (USA p. 33–34).
  - Worked example: 689 points × 1.6 = $ 1,102.40 (USA p. 15–16).

### Rules from the GC Rules that affect the result

Not calculated; the result shows one informative note about them (D-012).

- **BR-19 «RINGANA only».** A partner active in another network-marketing business is settled
  at most as level 7 (she can reach level 8+, but is paid as level 7). Partners who do not build a team (TT − TT-1 < 7,000, «por lo general
  influencers») may promote other brands, and in that case their commission is limited to
  level 7. Classification follows the highest level of the last 12 months. — *Verified rule*
  (GC p. 10–11). The Peru, Colombia and Argentina guidelines label levels 1–7 «plan de
  compensación ordinario» and levels 8–10 «beneficio RINGANA only» (p. 5–6, 33–34).
- **BR-20 Fair score.** Sanctioned infringements lower the monthly fair score (1 unfair
  value = −1 %). Commission points are multiplied by fair score / 100. — *Verified rule*
  (GC p. 12–13). The calculator assumes 100 % (D-012).

## Constraints on what the tool says

- **BR-21 Earnings claims.** Information about income must always be correct; misleading
  statements and unrealistic income promises are not allowed. — *Verified rule* (GC 5.3.4,
  p. 18). Hence: every result is labelled as an estimate («the official settlement is
  RINGANA's»), and simulations say «you would need X points», never «you will earn».
- **BR-22 Brand.** The RINGANA brand, logos and trade dress are protected. — *Verified rule*
  (GC p. 8–9, p. 16–17). The tool uses the TCG identity and states it is unofficial (D-009).
  Partner websites must follow «Guidelines for Websites related to RINGANA» (S-08, missing; referenced in GC p. 24–25).

## Proposed features (not RINGANA rules)

Approved direction by the PO (D-002, D-013); exact behaviour still to be specified.

- **PF-01 Automatic level** from the inputs (BR-07, BR-08), with a breakdown.
- **PF-02 Next level**: what is missing for each way of qualifying (CT and/or TT-n), the
  smallest extra own CT that reaches it with the team unchanged (own points also raise TT and
  TT-n) and the estimated commission there. Reminds that new partners only count next month
  (BR-23).
- **PF-03 Target amount** («how many points would you need for X?»): the smallest extra own
  CT, in hundredths of a point, for an estimated commission ≥ X with the team unchanged; a
  target inside a jump lands on the jump. Worded per BR-21.
- **PF-04 Step chart** of the estimated commission against own CT (team unchanged), with
  the current position and a hover/keyboard readout. Only the next level is summarised in
  text (PO: focus on the next level).
- **PF-06 Prospect simulator** (D-017): build CT from fictitious orders using the points
  table of the selected market, optionally add a fictitious team, and show the resulting
  commission as a clearly labelled fictitious example (BR-21).
- **PF-07 Input like the Online Office** (Q-12): points per generation and the VE of each
  direct partner; the strongest team's breakdown only when it exceeds the limit. Warnings when
  the direct partners' VE are missing (the level would be too high) or inconsistent.
- **PF-08 Reverse-engineering scenarios** (D-021, design §5): «Solo yo» (exact own-CT minimum),
  «Mi equipo y yo» and «Mayor aportación del equipo» (proposals from allocation strategies,
  binary search and non-dominated selection), plus a manual own-CT control. Extra team points
  are generated by each leg's direct partner (generation 1). Engine in `src/domain/scenarios/`;
  UI in tab 3 (`src/features/target/`). Each scenario is worded as a condition («si tú haces X
  puntos más y tu equipo Y, llegarías a…»), with the per-leg split by name, final CT, VE,
  VE-1/2/3, level, estimated commission and margin over the target.
- **PF-09 Planner** (D-022, design §7): target level, forecast per leg and for the partner,
  live comparison with the target, own CT needed (exact: own CT raises TT-n one to one), points
  missing per day until month end, approximate commission (legs spread like the real
  generations). Based on the team planner sheet «Planificador de metas TCG».
- **PF-05 Import** of current and previous-month points from RINGANA with the partner's own
  session (D-018); prerequisites Q-17 to Q-19.
