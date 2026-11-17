# TCG Commission Calculator

Unofficial commission calculator for TCG partners, based on the RINGANA target plan. Runs
entirely in the browser; no data is stored.

**Status:** phase 1 — manual calculator with result breakdown and simulations (next level,
target amount, step chart). Next: import from RINGANA (D-018, prerequisites Q-17 to Q-19).

## Development

The shared UI package `@anibelin007/tcg-ui` is private: add a GitHub token with
`read:packages` to your user `~/.npmrc` once (see the `tcg-ui` README). Then:

```bash
npm install
npm run dev     # local app
npm run check   # typecheck + lint + tests + build
```

### Preview on GitHub Pages

Every push to `main` publishes a preview to `https://anibelin007.github.io/tcg-commission-calculator/`
(`.github/workflows/deploy-pages.yml`, D-026). Temporary, for feedback only; it is not the final
hosting. To check the Pages build locally:

```bash
PAGES_BASE_PATH=/tcg-commission-calculator/ npm run build
PAGES_BASE_PATH=/tcg-commission-calculator/ npm run preview
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
