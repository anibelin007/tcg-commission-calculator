# Sources

The calculator reproduces RINGANA's official commission rules. **The commission guidelines
are the source of truth** (decision D-001). The team's Google Sheet calculator is *not* a
reference; it was only used to understand what the product owner wants to build.

The source PDFs are RINGANA documents provided by the product owner. **They are not stored in
this repository** (decision D-011): only the extracted rules, with the document, version and
printed page they come from.

## Evidence classification

Every functional statement in this project is tagged with one of:

| Tag | Meaning |
|---|---|
| **Verified rule** | Stated in a source below, with a precise citation (document, version, printed page). |
| **Observed behaviour** | Seen in a real commission settlement (Billing Document, Personal Report). |
| **Inference** | Deduced from the sources but not stated in them. |
| **Pending verification** | Not yet confirmed: source missing, ambiguous or contradictory. |
| **Provisional decision** | A product-owner decision taken to keep moving while a rule is pending verification. Must be revisited when the evidence arrives. |
| **Proposed improvement** | A feature or behaviour that is not a RINGANA rule. Never applied without explicit approval. |

Citations use the short IDs below, e.g. *EU-ES p. 13* = printed page 13 of S-01.

## Inventory

| ID | Source | Version / date | Language(s) | Status |
|---|---|---|---|---|
| S-01 | RINGANA commission guidelines — EU (ES) | RCG 3.4, 06/2026 | es | Available (PO upload). **Reference text** for EU rules. |
| S-02 | RINGANA commission guidelines — EU (other languages) | RCG 2.5, 06/2026 | en, de, cs, sk, pl, hu, pt, nl, it | Available (PO upload). Same rules and figures as S-01 (cross-checked, see below). |
| S-03 | RINGANA commission guidelines — Mexico | RCG 2.4, 06/2026 | es (MX) | Available (PO upload). Same target plan as EU; own points factor, currency and payout threshold. |
| S-04 | RINGANA commission guidelines — USA | RCG 1.0, 10/2026 | en | Available (PO upload). **Different plan** (Direct Turnover; other qualification minima). |
| S-05 | RINGANA GC Rules (Governance & Communication Rules) | V2.4, 06/2026 | es | Available (PO upload). Affects commission (fair score, «RINGANA only») and what the tool may say (earnings claims, brand). |
| S-06 | RINGANA GC Rules — Turkey | V1.2, 06/2026 | tr, en | Available (PO upload). Not yet analysed; no Turkish commission guideline available (Q-09). |
| S-07 | RINGANA points table (ES) | Undated (PO upload, 2026-11) | es | Available. Price and points per product; points have two decimals. Not needed in phase 1. |
| S-08 | «Guidelines for Websites related to RINGANA» | — | — | **Missing.** Referenced by S-05 as mandatory for partner websites (Q-08). |
| S-09 | Real Billing Document with a strongest team above the limit | — | — | **Missing.** Requested by the PO from a fellow partner (Q-01). |
| S-10 | RINGANA Online Office data services (current points) | — | — | **Missing.** PO to list the available services (Q-03). |
| S-11 | Team Google Sheet «Calculadora de comisión TCG» | Read 2026-11-15 | es | Read-only. **Not a reference** (D-001). Its known defects are listed below only to explain why. |

## Cross-language check of the EU guidelines (S-01 vs S-02)

All numbers of the English edition were compared with the es, de, cs, pl, hu, pt, nl and it
editions (sk extracted, comparison pending). The target plan, qualification minima, limits,
points factors and Fast Track amounts are identical. Differences found:

| Where | Finding | Impact |
|---|---|---|
| BT10 promotion table (p. 29), NPV-5 (3Gen) for *Team Focus* | **ES says 10,000 points**; en, pt, it, pl say **7,000** (= 10,000 − 30 %). | ES erratum. Out of scope until phase 3 (Q-10). |
| BT10 promotion table, struck-through original values | it and pt show different struck-through values. | Typos in crossed-out values; effective values agree. |
| Payout section (p. 34) | The en edition adds: «small commission limit in Mexico is MXN 1,700 or € 89». | Consistent with S-03. |

## Why the team Google Sheet is not a reference (S-11)

Recorded so the differences are not mistaken for regressions:

- It does not determine the target level; the user picks the column. Only levels 1–2 check
  the 110-point minimum; levels 3–10 check no qualification criterion.
- The limit for the strongest team is applied to the **generation** with the most points, not
  to the strongest **team** (EU-ES p. 11).
- Level 5: generation 6 (1 %) has a rate but no input or formula and is not summed.
- Levels 6–7: the `MAX` range shifts row by row, so several generations can be capped.
- It mentions «VE-3 − VC ≥ 10,000 for levels 8–10», which is not in S-01. The closest current
  rule is in S-05 (VE − VE-1 < 7,000 ⇒ commission limited to level 7, only for partners who
  promote other brands); see BR-19.
