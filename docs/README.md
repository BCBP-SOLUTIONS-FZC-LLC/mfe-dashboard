# Docs

Operator material for `mfe-dashboard`. Product setup stays in the repository [README](../README.md). Version rules stay in [VERSIONING.md](../VERSIONING.md).

| Area | What it is |
|---|---|
| [lld/mfe-dashboard-lld.md](lld/mfe-dashboard-lld.md) | Low-level design: runtime contract, SDK usage, domain model, flows, failure handling, open items |
| [architecture/constitution-assessment.md](architecture/constitution-assessment.md) | Frontend Architecture Constitution: assessment, violations, target, folder and dependency plans, roadmap |
| [adr/](adr/README.md) | Architecture decision records 0001–0008 |
| [architecture/](architecture/README.md) | Mermaid sources embedded in [ARCHITECTURE.md](../ARCHITECTURE.md) |
| [pipeline/](pipeline/README.md) | What `ci.yml` and `release.yml` run, and in which order |
| [runbook-coverage-gate.md](runbook-coverage-gate.md) | A red `validate-test` job |
| [runbook-image-scan.md](runbook-image-scan.md) | Hadolint, digest pin, Trivy, or the smoke script |
| [runbook-release.md](runbook-release.md) | A tag that does not publish; the standalone runtime config deploy check |
| [observability/metrics.md](observability/metrics.md) | The dashboard's metrics (Tier 3 `portal_dashboard_*`), the checks CI runs, proposed recording rules, alerts and SLOs, runbook |

Test layout: [test/README.md](../test/README.md). Claude Code guidance: [.claude/CLAUDE.md](../.claude/CLAUDE.md).

The metric registry itself is the platform's (`platform-gincommon`, synced into the SDK); this remote adds no registry entries. It has no Helm chart or schema registry.
