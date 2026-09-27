# Source map

```text
src/
├── App.svelte                  Application composition and state lifetime
├── app/
│   ├── createNavigation.svelte.js
│   ├── pages.js                Page titles, descriptions and breadcrumbs
│   └── layout/                 Sidebar, top bar, heading and footer
├── features/
│   ├── deep-dive/
│   │   ├── DeepDivePage.svelte  Client or sector monthly analysis
│   │   ├── createDeepDive.svelte.js  In-session selection and source updates
│   │   ├── components/         Monthly history chart and accessible values
│   │   └── domain/             Metric registry and aggregation functions
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

Deep Dive reads usage directly, including historical and inactive accounts. Sector membership comes from the currently uploaded customer profiles joined by ID; missing sectors are excluded. Monthly totals are snapshots, never sums across months. Times and days use a simple mean of known client values; volumes and amounts use sums. Cards and history report coverage against all clients with usage in the selected sector. Missing values remain unknown; a partial sum includes only known values and displays its coverage. The latest month follows the existing partial-month rule.

To add a metric, extend `features/deep-dive/domain/metrics.js` with an `id`, `label`, `group`, `unit`, aggregation description and `calculate(rows)` returning `{ value, count }`. For a derived metric, implement its calculation there and count only clients with all required inputs. Cards, metric selection and history share that registry; no separate screen implementation is needed. Extend formatting or aggregation labels there and in the view if introducing a new unit or aggregation method. New raw CSV columns also require updating the CSV schema.

### Advanced Deep Dive analysis

`domain/advanced.js` owns the diagnostic definitions, configurable defaults, date windows, coverage, prioritization and trend calculations. `AdvancedAnalysis.svelte` renders the panorama and evidence; `AdvancedChart.svelte` renders independent line/bar charts with accessible data tables. The advanced selector sits beside the raw metric selector; selecting either a raw metric or its card returns to ordinary history. Selections and advanced thresholds persist only within the session.

- Service: any known value meeting its threshold confirms an immediate-review signal. Inactive days use the shared inactivity rule; initial thresholds are 5 integration errors or 10 undelivered messages. Lower counts remain visible. Missing inputs cannot establish absence of incidents. The data does not establish root cause or whether an incident is still open.
- Disengagement: all three panel activity fields zero for two consecutive full months, or a strict decline over both intervals of three consecutive full months, with at least a 50% cumulative drop in at least two fields (sessions, active days, active users). Configuration changes provide context only. Missing calendar months break continuity. Conversation declines do not drive this signal.
- Activation: current profile must be active, checkout must be a valid date, and age at the selected cutoff must be 30–120 days. The last two consecutive full calendar months must begin on or after checkout and each have conversations at or below the shared low-usage rule. Checkout is only a proxy for implementation; missing or ineligible profiles remain unevaluable. Full months use month end; the final partial month uses the exercise's day-21 cutoff.
- Context: overdue payment (shared rule), unanswered handoffs (20% initially, valid numerator/denominator pair required), team response time (24h) and reopened ticket count (3). These are not independent primary alerts; their count breaks ties within service, disengagement or activation priorities. No monetary weighting or churn probability is inferred.

In sector mode, diagnostics run per account before counting affected/evaluable accounts. Missing data and ineligible activation windows are explicitly reported; averages cannot hide a service incident. Chart aggregations are labeled: counts summed for integration errors and undelivered messages, per-account means for days, panel usage and conversations, and paired numerator/denominator sums for team participation. Only dates through the selected cutoff appear, with up to 12 calendar months and explicit gaps. The last partial month is excluded from participation and activation trends but retained for service counts. Profiles carry current labels/status, not historical profile snapshots.

Advanced thresholds are adjustable in the analysis details and do not change the portfolio signal queue. Shared inactivity, payment, activation and partial-month rules still come from the existing Rules screen. These defaults are proposed operational heuristics, not a validated predictive model. Extend `advancedViews`, the per-account diagnosis and `advancedCharts` to introduce another diagnostic.
