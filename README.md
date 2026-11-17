# TCG Commission Calculator

Unofficial commission calculator for TCG partners, based on the RINGANA target plan. Runs
entirely in the browser; no data is stored.

**Status:** phase 1 in progress — manual calculator working (market, own points, teams by
generation, result breakdown). Next: simulations (next level, target amount, step chart).

## Development

The shared UI package `@anibelin007/tcg-ui` is private: add a GitHub token with
`read:packages` to your user `~/.npmrc` once (see the `tcg-ui` README). Then:

```bash
npm install
npm run dev     # local app
npm run check   # typecheck + lint + tests + build
```

UI languages: es-ES (reference), ca-ES, eu-ES, en-GB, en-US, de-DE, de-AT (D-015).
Texts other than es-ES are drafts until a person reviews them.

| Topic | File |
|---|---|
| Sources and evidence tags | [`docs/sources/README.md`](docs/sources/README.md) |
| Business rules (phase 1) | [`docs/functional/business-rules.md`](docs/functional/business-rules.md) |
| Open questions | [`docs/functional/open-questions.md`](docs/functional/open-questions.md) |
| Decisions | [`docs/architecture/decision-log.md`](docs/architecture/decision-log.md) |
| Test cases | [`docs/qa/test-cases.md`](docs/qa/test-cases.md) |
| Roadmap | [`docs/plan/roadmap.md`](docs/plan/roadmap.md) |
| Conventions for Claude Code | [`CLAUDE.md`](CLAUDE.md) |

> Results are estimates. The official commission is the one settled by RINGANA.
