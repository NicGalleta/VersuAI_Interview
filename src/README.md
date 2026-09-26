# Source map

```text
src/
├── App.svelte                  Application composition and state lifetime
├── app/
│   ├── createNavigation.svelte.js
│   ├── pages.js                Page titles, descriptions and breadcrumbs
│   └── layout/                 Sidebar, top bar, heading and footer
├── features/
│   ├── portfolio/
│   │   ├── PortfolioPage.svelte
│   │   ├── createPortfolio.svelte.js
│   │   ├── components/         Summary, filters, table, account detail, drafts
│   │   └── domain/             Prioritization, message templates and CSV export
│   ├── data-sources/
│   │   ├── DataSourcesPage.svelte
│   │   ├── createDataSources.svelte.js
│   │   ├── components/         File selection and data quality
│   │   └── csv/                Required columns and CSV validation
│   ├── rules/
│   │   ├── RulesPage.svelte
│   │   ├── defaults.js         Initial thresholds used by analysis
│   │   ├── ruleDefinitions.js  Slider labels, ranges and units
│   │   └── components/         Rule control and impact preview
│   └── notco/
│       ├── NotCoPage.svelte
│       ├── createNotCoAgent.svelte.js
│       ├── components/         Editor, chat preview, tests, catalog, kickoff
│       └── data/               Catalog, initial prompt, test cases and questions
├── shared/
│   ├── actions/               Drawer focus trap and focus restoration
│   ├── components/            Feedback messages
│   └── utils/                 Formatting, normalization and file downloads
└── styles/                    Global styles grouped by screen and purpose
```

Pages compose feature components. Components render the existing UI; feature state factories own reactive data and event handlers. Pure domain functions do not depend on Svelte or browser APIs. Layout components stay separate from feature actions.

`App.svelte` creates the navigation, data sources, portfolio and NotCo state once. Switching pages therefore preserves uploaded data, unsaved prompt edits, the selected NotCo tab and other in-session state. Navigation keeps the original filter reset behavior. Only prompt versions persist to local storage; contacts stay in memory.

CSS is imported in its original cascade order through `styles/index.css`, preserving existing selectors, responsive rules and contrast overrides. Components introduce no additional DOM wrappers.

Checks live in `tests/unit/` and `tests/browser/`. Run `npm run format` when editing and `npm run format:check` to verify consistent formatting.
