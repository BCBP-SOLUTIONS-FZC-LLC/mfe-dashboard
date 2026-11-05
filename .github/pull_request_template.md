## Description
Provide a clear description of the changes.

---

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] Test
- [ ] Breaking change
- [ ] Dependency update

---

## Testing
- [ ] `npm run test:ci` passes (unit, integration, e2e, coverage ≥ 95%)
- [ ] `npm run build` passes (typecheck and production bundle)
- [ ] Manual testing performed (dashboard, user management, theme, logout)

---

## Checklist

### Code Quality
- [ ] No debug logs or commented-out code
- [ ] No secrets, tokens, or `.env` values committed
- [ ] `CHANGELOG.md` updated under `Unreleased` when this PR changes `src/`, dependencies, the Dockerfile, or nginx config

### Remote contract
- [ ] Container `app2`, expose `./App`, and the preset version still load in the shell (`rsbuild.config.ts`; preset not newer than web-shell's SDK)
- [ ] New `PUBLIC_*` variables documented and given a Dockerfile `ARG` default when the image build needs them

### Security
- [ ] `localStorage` is limited to the theme keys (`bcbp.themeMode`, `bcbp.appTheme`)
- [ ] `PUBLIC_APP1_URL` is not taken from the page URL

---

## Related Issue
Closes #<issue-id>

---

## Deployment Notes
Mention anything operators need when upgrading (new `PUBLIC_*` build args, remote URL changes, nginx path changes).
