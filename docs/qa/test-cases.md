# Test cases — phase 1

Implemented as table-driven tests in `src/domain/commission/commission.test.ts`. Two kinds:

- **Guideline cases (TC-xx)**: inputs and expected results printed in the guidelines.
- **Derived cases (S-xx)**: synthetic inputs whose expected results follow from verified rules
  (cited). They test boundaries; they are not official RINGANA results.

All amounts EU standard market (factor 1.32, EUR) unless stated. Rounding per BR-17
(provisional: final amount to cents, half up). Synthetic data only.

## Guideline cases

| ID | Inputs | Level | Points | Expected | Source |
|---|---|---|---|---|---|
| TC-01 | CT 1,000; no team | 3 (CT ≥ 825) | 390 | **514.80 €** · MX: 10,140 MXN | EU-ES p. 14; MX p. 13–14 |
| TC-02 | CT 1,000. Team 1: A (gen 1) 700 → C (gen 2) 1,000. Team 2: B (gen 1) 900 → D (gen 2) 600, E (gen 2) 300 | 3 (CT ≥ 330, TT-1 2,700 ≥ 1,600) | 689 | **909.48 €** · MX: 17,914 MXN · USA: $ 1,102.40 | EU-ES p. 9–10, 15; MX p. 15–16; USA p. 15–16 |
| TC-04 | TC-01 and TC-02 in Peru, Colombia and Argentina | 3 | 390 / 689 | PE 2,028 / 3,582.8 PEN · CO 2,433,600 / 4,299,360 COP · AR 861,900 / 1,522,690 ARS | PER, COL, ARG p. 13–16 (PER p. 14 prints 2,208: erratum, Q-21) |
| TC-03 | Same team as TC-02 | — | — | TT = 4,500; TT-1 = 2,700 | EU-ES p. 9–10 |

**TC-02 and the strongest-team limit (Q-01).** Team 2 (TT 1,800) is above the level 3 limit
(1,500). With the default (limit not applied, D-005) the result is the guideline's 909.48 €,
with a note. Under the alternative reading BR-12a/b its commission (153 points) becomes
153 × 1,500 / 1,800 = 127.5, total 663.5 points = 875.82 €. The tests cover the three
strategies; none may be «fixed» to match another.

## Derived cases (boundaries)

| ID | Inputs | Level | Points | Expected | Rules |
|---|---|---|---|---|---|
| S-00 | CT 109; no team | none | 0 | 0 € (no commission) | BR-07, BR-09 |
| S-01 | CT 110; no team | 1 | 20.90 | 27.59 € · voucher reminder | BR-07, BR-10, BR-16 |
| S-02 | CT 384; no team | 1 | 72.96 | 96.31 € | BR-07, BR-10 |
| S-03 | CT 385; no team | 2 | 111.65 | 147.38 € | BR-07, BR-10 |
| S-04 | CT 824; no team | 2 | 238.96 | 315.43 € | BR-07, BR-10 |
| S-05 | CT 825; no team | 3 | 321.75 | 424.71 € | BR-07, BR-10 |
| S-06 | CT 220; one direct partner with 780 (TT 1,000) | 2 (CT ≥ 220, TT ≥ 1,000) | 126.20 | 166.58 € | BR-05, BR-07, BR-11 |
| S-07 | CT 400; one direct partner with 10,000 (TT 10,400; TT-1 400) | 2 | 916 | **1,209.12 €** by default (limit not applied, D-005) | BR-07, BR-12 — 258.72 € under BR-12a/b (800 × 1,000 / 10,000 = 80 points); 1,209.12 € also under Q-01 option (c) |
| S-08 | Payout threshold, EUR | — | — | 65.00 € → voucher; 65.01 € → transfer | BR-16 («superiores a 65 €») |

## Reverse-engineering scenarios (D-021)

Synthetic partner E: CT 600, generations 900 / 700, legs with VE 1,000 and 600 → level 2,
361.68 €. Expected values derived by hand from the verified rules; tests in
`src/domain/scenarios/`.

| ID | Case | Expected |
|---|---|---|
| R-01 | Reach 529.32 € (entering level 3, TT-1 ≥ 1,600) with team points only | levelling 400 (all to the weak leg) · equal 800 · proportional 1,066.66 |
| R-02 | Target 600 €, «Solo yo» | +225 CT → level 3, 602.91 € (exact minimum) |
| R-03 | Target 600 €, «Mayor aportación del equipo» | 0 CT + 1,069.28 team points (334.64 / 734.64) → 600.00 € (599.996 rounded, BR-17) |
| R-04 | Target 600 €, «Mi equipo y yo» | +112.50 CT + 520.84 team points (60.42 / 460.42) → 600.00 € |
| R-05 | Manual own +100, target 600 € | 581.78 team points, levelled |
| R-06 | +600 to the weak leg | legs 1,000 / 1,200: the weak leg becomes the strongest; TT-1 = 1,600 → level 3 |
| R-07 | No legs / own CT below level 1 | team scenarios infeasible (`noLegs` / `ownBelowLevel1`) |

Property tests (seeded random partners in ES, MX, US, PL): the commission never decreases when
own or leg points grow; every returned scenario reaches the target when recomputed with the
engine; the two team scenarios never dominate each other.

## Cross-plan and cross-locale checks

- Same inputs ⇒ same level and points in every UI language; only the formatting changes.
- Same inputs and plan `eu` ⇒ points identical in every EU market; only the factor and currency
  change.
- Plan `usa`: a partner with CT 300 + PT 200 (DT 500) and TT-1 3,500 reaches level 3, **not**
  level 4, because level 4 requires CT ≥ 330 (BR-18).
