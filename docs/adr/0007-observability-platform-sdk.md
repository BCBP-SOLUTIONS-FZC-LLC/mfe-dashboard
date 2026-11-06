# 0007: Observability through the platform SDK; the shell owns the telemetry provider

**Status:** Accepted (2026-11-06)

## Context

The constitution requires OpenTelemetry, correlation IDs, structured logging, error boundaries, distributed tracing, and a `TelemetryProvider` at bootstrap. In this platform, a remote runs inside web-shell, which already does all of this through the SDK:
- `initializeTracing`, `initializeLogging` and `initializeMetrics` (OTLP to `/otel`);
- web vitals;
- global error handlers;
- consent;
- `PlatformProvider`, the SDK's React provider.

A second provider or OpenTelemetry SDK in a remote would duplicate the shell's and break the one-identity-per-page rule.

## Decision

The remote uses the SDK's facilities and starts none of its own:
- `getLogger({ mfe })` for structured, redacted logs;
- `MFEErrorBoundary` around the routed page and the standalone root;
- `getServiceMeter` for its Tier 3 metrics (`docs/observability/metrics.md`);
- the `ApiClient`'s trace and correlation headers.

The shell's `PlatformProvider` is the `TelemetryProvider`. `dependency-rules.test.ts` rejects direct OpenTelemetry, Prometheus client or web-vitals imports and any telemetry start-up in `src/`.

## Consequences

- Telemetry is consistent across the shell and its remotes, and consent-gated.
- The standalone page exports nothing (no collector). Its warnings reach the console through the SDK logger.
