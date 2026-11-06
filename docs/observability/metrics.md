# Metrics

The dashboard's metrics under the Enterprise Platform Observability Standard. They are defined in [`src/infrastructure/telemetry/metrics.ts`](../../src/metrics.ts) and recorded through the platform SDK's `/metrics` (`getServiceMeter`). `test/unit/metrics/metrics.test.tsx` fails when this page, the code and the SDK's rules disagree.

## Tier

| Tier | Used here | Why |
|---|---|---|
| 1 `platform_*` | None of our own | The registry's platform metrics describe servers, messaging and databases. The browser's Core Web Vitals (`platform_web_vitals_seconds`, `platform_web_vital_ratings_total`) are recorded by web-shell's `startWebVitals()` for the whole page, and are awaiting ratification |
| 2 `portal_*` | None | The registry has no `portal` domain metric. Services must not invent shared metrics; a proposal goes to observability governance first |
| 3 `portal_dashboard_*` | All three below | Behaviour only this remote has |

The SDK builds the scope: inside web-shell, `domain` is this remote's manifest `ownerDomain` (`portal`) and `service` is its name (`dashboard`), hence the prefix `portal_dashboard_`. It injects `domain`, `service` and `environment` on every point, so the code cannot omit or misspell them. The shell exports the points (`initializeMetrics`, OTLP to `/otel`, only with telemetry consent). The standalone page exports nothing.

## Inventory

| Metric | Type | Labels (allowed values) | Meaning |
|---|---|---|---|
| `portal_dashboard_ticket_loads_total` | counter | `view` (`my-tickets`, `awaiting-review`, `awaiting-approval`, `delegated`, `all-tenders`), `trigger` (`initial`, `refresh`), `outcome` (`success`, `error`) | Ticket list loads that finished, by view, what started them and outcome (success, or error for an API, network or timeout fault). Loads superseded by a newer one are not counted. |
| `portal_dashboard_ticket_load_duration_seconds` | histogram | `view` (`my-tickets`, `awaiting-review`, `awaiting-approval`, `delegated`, `all-tenders`), `outcome` (`success`, `error`) | Time from starting a ticket list load to its result, by view and outcome. Superseded loads are not recorded. |
| `portal_dashboard_step_up_requests_total` | counter | — | Re-authentication (MFA step-up) requests started from the approval banner. |

Plus `domain`, `service` and `environment` on every series (SDK). Cardinality: at most 5 × 2 × 2 = 20 series for the counter and 10 for the histogram per environment. Histogram buckets are the registry's `request_duration` preset. `outcome` uses the registry's vocabulary; this remote uses only `success` and `error` (`failure` is for business rejections, which a ticket load does not have).

While tickets are fixtures (LLD §15 item 1), the duration measures the simulated load. The metrics become meaningful when the ticket API replaces the fixture loader; the names and labels stay the same.

## Rules (checked in CI)

`npm test` runs `test/unit/metrics/metrics.test.tsx`. CI's `Validate / Test` job runs it on every PR. It checks:

| Rule | Check |
|---|---|
| Namespace | Every name starts with `portal_dashboard_`; none is a `platform_*`, a registry metric (any tier) or a legacy name |
| Suffix | Counters end in `_total`, histograms in `_seconds` |
| Required labels | `domain`, `service`, `environment` are not declared (the SDK injects them) and appear on every recorded series with `portal` / `dashboard` |
| Prohibited labels | No registry-prohibited name or suffix (`*_id`, `email`, `user`, `path`, …); at most 8 labels |
| Label vocabulary | Every label has a closed value set, enforced by `recordMetric`'s types; `outcome` values come from the registry's vocabulary, and the SDK drops a value outside it at run time (it also caps any other label at 100 values) |
| SDK compliance | With the remote in the manifest, the SDK accepts every definition (its own namespace, suffix, label and registry checks) |
| Inventory | This table matches `src/infrastructure/telemetry/metrics.ts` |

## Dashboards, alerts, recording rules and SLOs (proposals)

This repository does not hold the platform's Prometheus or Grafana configuration. Whoever owns the frontend dashboards can start from these. Series arrive with OTLP delta temporality and are stored as Prometheus counters and histograms.

```promql
# Recording rules
portal_dashboard:ticket_loads:rate5m = sum by (environment, view, outcome) (rate(portal_dashboard_ticket_loads_total[5m]))
portal_dashboard:ticket_load_errors:ratio5m =
  sum by (environment) (rate(portal_dashboard_ticket_loads_total{outcome="error"}[5m]))
  / sum by (environment) (rate(portal_dashboard_ticket_loads_total[5m]))
portal_dashboard:ticket_load_duration:p95_5m =
  histogram_quantile(0.95, sum by (environment, le) (rate(portal_dashboard_ticket_load_duration_seconds_bucket{outcome="success"}[5m])))
```

| Proposal | Expression | Threshold |
|---|---|---|
| Alert: ticket loads failing | `portal_dashboard:ticket_load_errors:ratio5m` | > 5% for 10 min, with at least 20 loads in the window |
| Alert: ticket loads slow | `portal_dashboard:ticket_load_duration:p95_5m` | > 3 s for 15 min |
| SLO: availability | successful / all `portal_dashboard_ticket_loads_total` | 99.5% over 28 days |
| SLO: latency | share of successful loads under 2 s (`le="2"` bucket) | 95% over 28 days |

Thresholds are starting points, to be set once a real ticket API is behind the loader. Browser metrics depend on consent, so absolute counts undercount traffic: alert on ratios, not on volume.

**HPA:** not applicable. The remote is static files (S3/CloudFront, or nginx); nothing scales on these metrics.

## Runbook

| Symptom | Check |
|---|---|
| No `portal_dashboard_*` series at all | Is the remote in the environment's `/remotes/manifest.json` with `ownerDomain: "portal"`? Without it the SDK cannot scope the metrics and the console shows `dashboard metrics unavailable` once. Is the shell's telemetry enabled (`runtime.json` `telemetry.enabled`) and is `/otel` routed to the collector? Did the user grant telemetry consent? |
| Series under another `domain` or `service` | The manifest key or `ownerDomain` changed. The prefix check in the SDK then drops the points (`dashboard metrics unavailable`). Fix the manifest; renaming the metrics is a contract change |
| Error ratio up | Look at the matching `dashboard tickets failed to load` warn logs (same `view`; they carry the SDK's problem type and request id) |
| p95 up | Compare with web-shell's Core Web Vitals and the API's `platform_http_request_duration_seconds` for the same window |

## Changing a metric

Names, labels and their values are part of the observability contract. Adding a metric or a label value: add it to `src/infrastructure/telemetry/metrics.ts` and this table in the same PR. Renaming or removing one: emit old and new in parallel, move dashboards, alerts, recording rules and SLOs, then remove the old one after the agreed sunset (the standard's migration process), with a CHANGELOG entry at each step. A metric that other services could emit with the same meaning is proposed to the Platform Observability Registry, not added here as Tier 3.
