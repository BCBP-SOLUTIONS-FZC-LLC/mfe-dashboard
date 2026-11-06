## Description
Provide a clear description of the changes and why.

---

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Test
- [ ] Breaking change (runtime contract, see VERSIONING.md)
- [ ] Dependency update (platform packages: same version as web-shell)

---

## Testing
- [ ] `npm run lint` and `npm run arch-lint` pass
- [ ] `npm run test:ci` passes (unit, integration, e2e; coverage ≥ 95%, every domain file > 90%)
- [ ] `npm run build` passes (type check and both environments)
- [ ] `npm run test:browser` passes when the UI, theme or layout changed (no axe violations)
- [ ] Manual check (dashboard, user management, theme, logout; inside web-shell when the contract changed)

---

## Checklist

### Code quality
- [ ] New behaviour is tested in the right layer, with injected dependencies (`testDependencies`), not mocked modules
- [ ] Every new UI string is a key in `en.json`; unused keys removed
- [ ] No debug logs, `console` calls or commented-out code
- [ ] `CHANGELOG.md` `[Unreleased]` updated when this PR changes `src/`, dependencies, the Dockerfile, nginx, `rsbuild.config.ts` or `index.html`
- [ ] Docs updated per CONTRIBUTING.md's documentation checklist

### Remote contract
- [ ] Container `dashboard` and `./App` (optional props) unchanged, or the break is in VERSIONING.md and the CHANGELOG
- [ ] Platform packages equal to web-shell's; the SDK is not bundled into the remote
- [ ] Access by permission, never by role name

### Security
- [ ] No secrets, tokens or `.env` values committed
- [ ] Browser storage only through the SDK's `storage('dashboard')` (theme keys)
- [ ] No environment-specific value compiled in: it comes from `/config/runtime.json` (`environment`, `auth.signInUrl`), never from the page URL

---

## Related Issue
Closes #<issue-id>

---

## Deployment Notes
Anything operators or web-shell need when upgrading: manifest key or shell version, platform packages, permissions, `runtime.json` keys, nginx paths.
