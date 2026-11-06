// Architecture lint for mfe-dashboard: the Frontend Architecture Constitution's layers (ADR 0001),
// written the way iam-org-membership's .go-arch-lint.yml writes Clean Architecture for Go: named
// components (path patterns), what each may depend on (an allow-list: anything not allowed below is a
// violation), and which may use third-party packages (go-arch-lint's anyVendorDeps).
// `npm run arch-lint`; CI runs it in Validate / Quality.
//
// Components (src/<layer>/…):
//   app             composition root: bootstrap, App/routes, layouts, providers, configuration, styles
//   presentation    pages, widgets, components, features (hooks calling use cases), theme
//   application     use cases and ports. Framework-free: no React, no SDK, no packages
//   domain          entities, value objects, rules, repository contracts. Pure: no packages at all
//   infrastructure  repository implementations, runtime configuration, storage, telemetry, auth
//   shared          constants, hooks, ui vocabulary, types, assets. Depends on nothing of ours
//
// Tests, scripts and config are not part of the runtime architecture and are excluded (as
// go-arch-lint's `exclude: test, scripts`). test/unit/architecture/layers.test.ts adds what an import
// graph cannot see: the folder set, and browser globals (window, fetch, localStorage) in domain/ and
// application/.

const LAYER = '^src/(app|presentation|application|domain|infrastructure|shared)/'

/** mayDependOn, per component (besides itself). */
const MAY_DEPEND_ON = {
  // composition root: wires everything.
  app: ['presentation', 'application', 'domain', 'infrastructure', 'shared'],
  // presentation: calls use cases (application), renders domain types, uses shared UI pieces.
  // Never infrastructure: implementations are injected by app/providers (ADR 0004).
  presentation: ['application', 'domain', 'shared'],
  // application: use cases over the domain's contracts.
  application: ['domain', 'shared'],
  // domain: no internal imports at all.
  domain: [],
  // infrastructure: implements domain contracts and application ports.
  infrastructure: ['application', 'domain', 'shared'],
  // shared: no internal deps.
  shared: [],
}

/** anyVendorDeps: components that may import npm packages (React, the platform SDK, …). */
const VENDOR_ALLOWED = ['app', 'presentation', 'infrastructure', 'shared']

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  allowed: [
    // Inside a component (src/<layer>/ → the same src/<layer>/).
    {
      comment: 'A component may use itself.',
      from: { path: `${LAYER}` },
      to: { path: '^src/$1/' },
    },
    // Between components: the mayDependOn table.
    ...Object.entries(MAY_DEPEND_ON)
      .filter(([, targets]) => targets.length > 0)
      .map(([layer, targets]) => ({
        comment: `${layer} may depend on ${targets.join(', ')}.`,
        from: { path: `^src/${layer}/` },
        to: { path: `^src/(${targets.join('|')})/` },
      })),
    // Packages (npm) and Node built-ins: only the vendor-allowed components.
    {
      comment: `Only ${VENDOR_ALLOWED.join(', ')} may import packages; domain and application stay framework-free.`,
      from: { path: `^src/(${VENDOR_ALLOWED.join('|')})/` },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-peer', 'npm-optional', 'npm-no-pkg', 'npm-unknown', 'core'] },
    },
    // Ambient type declarations (src/env.d.ts) are visible everywhere.
    {
      comment: 'src/env.d.ts declares ImportMeta and asset modules for every component.',
      from: { path: `${LAYER}` },
      to: { path: '^src/env\\.d\\.ts$' },
    },
  ],
  allowedSeverity: 'error',

  forbidden: [
    {
      name: 'presentation-no-sdk-data-access',
      comment:
        'Presentation never touches the SDK\'s storage, metrics or runtime config directly: those are infrastructure (storage/, telemetry/, configuration/), injected or reached through use cases.',
      severity: 'error',
      from: { path: '^src/presentation/' },
      to: { path: '@bcbp-solutions-fzc-llc/frontend-sdk/dist/(storage|metrics|config)/' },
    },
    {
      name: 'no-telemetry-libraries',
      comment: 'Metrics, traces and vitals go through the platform SDK only (ADR 0007), never OpenTelemetry, a Prometheus client or web-vitals directly.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: 'node_modules/(@opentelemetry|prom-client|web-vitals)/' },
    },
    {
      name: 'no-server-state-libraries',
      comment: 'Server state is the platform SDK\'s useApi (ADR 0002): no TanStack Query, SWR, axios or ky.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: 'node_modules/(@tanstack|swr|axios|ky)/' },
    },
    {
      name: 'no-circular',
      comment: 'No import cycles.',
      severity: 'error',
      from: { path: '^src/' },
      to: { circular: true },
    },
    {
      name: 'src-not-to-test',
      comment: 'Production code never imports tests or their fixtures.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^test/' },
    },
    {
      name: 'no-unresolvable',
      comment: 'Every import resolves (catches a moved or misspelled module).',
      severity: 'error',
      from: { path: '^src/' },
      to: { couldNotResolve: true },
    },
  ],

  options: {
    // Repo-root folders only: an unanchored `dist/` would also drop the SDK (node_modules/…/dist/).
    exclude: { path: '^(test|scripts|config|dist|coverage)/' },
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.json', '.d.ts'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
