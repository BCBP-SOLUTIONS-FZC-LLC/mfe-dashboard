# 0005: Localization through the platform SDK (`useT`)

**Status:** Accepted (2026-11-06)

## Context

The constitution requires every user-facing string to be localizable, through "i18next or an approved platform localization framework". The platform SDK provides one:
- `registerNamespace` and `useT` for messages;
- `useLocale`, and the shell's locale negotiation;
- ICU-style variables and plurals;
- `formatDate` (calendar days included), `formatNumber` and `formatMoney`;
- `problemMessage` for API errors.

## Decision

Use the SDK's localization. The catalog is `src/app/configuration/locales/en.json`, registered under the `dashboard` namespace in `src/app/configuration/i18n.ts`. `test/unit/i18n/catalog.test.ts` fails on a missing or unused key and on hard-coded UI text.

## Consequences

- The shell and every remote share one locale and one formatter set.
- i18next is not added.
- Only English exists today (LLD §15 item 4). A new locale is a new catalog file.
