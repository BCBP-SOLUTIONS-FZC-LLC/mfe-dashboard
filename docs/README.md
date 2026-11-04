# Docs

Operator material for `mfe-dashboard`. Product setup stays in the repository [README](../README.md). Version rules stay in [VERSIONING.md](../VERSIONING.md).

| Area | What it is |
|---|---|
| [lld/mfe-dashboard-lld.md](lld/mfe-dashboard-lld.md) | Low-level design: runtime contract, SDK usage, domain model, flows, failure handling, open items |
| [architecture/](architecture/README.md) | Mermaid sources embedded in [ARCHITECTURE.md](../ARCHITECTURE.md) |
| [pipeline/](pipeline/README.md) | What `ci.yml` and `release.yml` run, and in which order |
| [runbook-coverage-gate.md](runbook-coverage-gate.md) | A red `validate-test` job |
| [runbook-image-scan.md](runbook-image-scan.md) | Hadolint, digest pin, Trivy, or the smoke script |
| [runbook-release.md](runbook-release.md) | A tag that does not publish |

Test layout: [test/README.md](../test/README.md). Claude Code guidance: [.claude/CLAUDE.md](../.claude/CLAUDE.md).

This remote has no metrics registry, Helm chart, or schema registry. Those documents in `iam-org-membership` have no counterpart here.
