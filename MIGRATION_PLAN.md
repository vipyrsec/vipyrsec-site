# Vipyrsec-Site Migration Plan

## Objectives

- Refresh `vipyrsec-site` onto a current Astro stack.
- Reduce dependency surface area and remove stale template baggage.
- Replace AstroWind-specific integration code with local, first-party project code.
- Treat Dependabot PRs as hints, not source of truth.
- Prefer built-in Astro or local utilities over new packages.

## Baseline

- Local `main` matches GitHub `main` at `02b66b6` on 2026-03-01.
- Working branch for this effort: `chore/site-refresh-migration`.
- Open issues:
  - `#83` Rehost site on Vercel
  - `#72` applying dark theme causes screen flicker
  - `#4` Add Contact Form
  - `#3` Add Docs subdomain
  - `#2` Dark/Light Theme Agnostic Icon
- Open PRs:
  - `#170` bump `h3` to `1.15.8`
  - `#169` bump `undici` to `6.24.1`
  - `#167` bump `devalue` to `5.6.4`
  - `#166` bump `tar` to `7.5.11`
  - `#158` security upgrade `astro` from `5.17.1` to `5.17.3`

## What The Audit Found

- The site is still coupled to a local AstroWind bridge under `vendor/integration`.
- Many source files import `astrowind:config`, so config flattening is the main decoupling task.
- `@astrojs/partytown` is dormant because `hasExternalScripts` is hard-coded to `false`.
- `astro-embed` appears unused in source.
- `js-yaml` and `lodash.merge` mainly exist to support the AstroWind config bridge.
- `@astrolib/analytics` and `@astrolib/seo` are likely replaceable with small local code.
- Dependabot PRs target transitive packages, so a fresh lockfile may supersede them.

## Version Verification

Manual registry verification was performed with `npm view`.

### Keep Or Upgrade In Place

| Package                            |  Current |   Latest | Socket Notes                         | Recommendation                            |
| ---------------------------------- | -------: | -------: | ------------------------------------ | ----------------------------------------- |
| `astro`                            | `5.18.0` |  `6.0.6` | Strong scores across the board       | Upgrade                                   |
| `@astrojs/rss`                     | `4.0.15` | `4.0.17` | Strong                               | Upgrade                                   |
| `@astrojs/sitemap`                 |  `3.7.0` |  `3.7.1` | Strong                               | Upgrade                                   |
| `@astrojs/check`                   |  `0.9.6` |  `0.9.8` | First-party                          | Upgrade                                   |
| `@astrojs/mdx`                     | `4.3.13` |  `5.0.2` | Strong                               | Upgrade                                   |
| `@astrojs/tailwind`                |  `6.0.2` |  `6.0.2` | Good maintenance, acceptable quality | Keep                                      |
| `astro-icon`                       |  `1.1.5` |  `1.1.5` | Strong                               | Keep for now                              |
| `sharp`                            | `0.34.5` | `0.34.5` | Strong                               | Keep                                      |
| `tailwindcss`                      | `3.4.17` |  `4.2.2` | Strong                               | Upgrade, but isolate as a migration slice |
| `@tailwindcss/typography`          | `0.5.19` | `0.5.19` | Strong                               | Keep                                      |
| `eslint`                           | `10.0.2` | `10.0.3` | Strong                               | Upgrade                                   |
| `@eslint/js`                       | `10.0.1` | `10.0.1` | Strong                               | Keep                                      |
| `eslint-plugin-astro`              |  `1.6.0` |  `1.6.0` | Strong                               | Keep                                      |
| `astro-eslint-parser`              |  `1.3.0` |  `1.3.0` | Good                                 | Keep                                      |
| `typescript`                       |  `5.9.3` |  `5.9.3` | Strong                               | Keep                                      |
| `typescript-eslint`                | `8.56.1` | `8.57.1` | Good maintenance, acceptable quality | Upgrade                                   |
| `@typescript-eslint/parser`        | `8.56.1` | `8.57.1` | Good                                 | Upgrade                                   |
| `@typescript-eslint/eslint-plugin` | `8.56.1` | `8.57.1` | Good                                 | Upgrade                                   |
| `prettier`                         |  `3.8.1` |  `3.8.1` | Strong                               | Keep                                      |
| `prettier-plugin-astro`            | `0.14.1` | `0.14.1` | Acceptable                           | Keep                                      |
| `globals`                          | `17.3.0` | `17.4.0` | Strong                               | Upgrade                                   |
| `reading-time`                     |  `1.5.0` |  `1.5.0` | Acceptable                           | Keep                                      |
| `mdast-util-to-string`             |  `4.0.0` |  `4.0.0` | Strong                               | Keep                                      |
| `unist-util-visit`                 |  `5.1.0` |  `5.1.0` | Strong                               | Keep                                      |

### Remove Or Replace

| Package               |        Current |         Latest | Socket Notes                                                           | Replacement                                                      |
| --------------------- | -------------: | -------------: | ---------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `astro-embed`         |       `0.12.0` |       `0.12.0` | Quality score is weak and it appears unused                            | Remove                                                           |
| `@astrojs/partytown`  |        `2.1.4` |        `2.1.5` | Unused at runtime due to disabled external scripts                     | Remove                                                           |
| `@astrolib/analytics` |        `0.6.1` |        `0.6.1` | Quality and supply-chain scores are the weakest in the app set         | Remove and replace with local analytics component only if needed |
| `@astrolib/seo`       | `1.0.0-beta.8` | `1.0.0-beta.8` | Beta package; not worth keeping when local metadata is straightforward | Remove and replace with local metadata helpers                   |
| `js-yaml`             |        `4.1.0` |        `4.1.1` | Acceptable, but only needed for AstroWind config loading               | Remove by converting site config to TypeScript                   |
| `lodash.merge`        |        `4.6.2` |        `4.6.2` | Acceptable, but not necessary for this project                         | Remove in favor of object spread or a tiny local helper          |
| `@types/js-yaml`      |        `4.0.9` |        `4.0.9` | Type-only support for removable package                                | Remove                                                           |
| `@types/lodash.merge` |        `4.6.9` |        `4.6.9` | Type-only support for removable package                                | Remove                                                           |

### Reevaluate During Tailwind Slice

| Package                      |  Current |   Latest | Notes                                                          |
| ---------------------------- | -------: | -------: | -------------------------------------------------------------- |
| `@fontsource-variable/inter` |  `5.2.8` |  `5.2.8` | Keep only if we still want this font after design cleanup      |
| `unpic`                      |  `4.2.2` |  `4.2.2` | Keep for now; revisit once image handling is simplified        |
| `limax`                      |  `4.2.2` |  `4.2.2` | Keep for now; revisit if native slug generation is enough      |
| `astro-compress`             |  `2.3.9` |  `2.4.0` | Useful, but can be dropped if hosting handles compression well |
| `@types/mdx`                 | `2.0.13` | `2.0.13` | Likely removable after Astro 6 verification                    |

## Transitive Dependency Notes

- Dependabot is flagging `h3`, `undici`, `devalue`, and `tar`.
- Latest versions observed manually:
  - `h3` -> `2.0.1-rc.16`
  - `undici` -> `7.24.4`
  - `devalue` -> `5.6.4`
  - `tar` -> `7.5.11`
- We should not force these directly unless they remain unresolved after the direct dependency and lockfile refresh.

## Proposed Migration Order

### Slice 1: Remove AstroWind Coupling

- Move `src/config.yaml` to a typed local config module such as `src/config/site.ts`.
- Replace the `astrowind:config` virtual module with direct local imports.
- Delete `vendor/integration`.
- Remove `js-yaml`, `lodash.merge`, and their type packages.

### Slice 2: Remove Dormant Or Dead Dependencies

- Remove `astro-embed`.
- Remove `@astrojs/partytown`.
- Replace `@astrolib/analytics` with a tiny local component if analytics is still required.
- Replace `@astrolib/seo` with local metadata rendering.

### Slice 3: Upgrade The Core Stack

- Upgrade Astro and first-party integrations to latest stable.
- Regenerate the lockfile from scratch.
- Review whether Tailwind 4 migration fits in the same branch or should stay on Tailwind 3 until the app is stable.

### Slice 4: Fix Known UX And Deployment Issues

- Address `#72` theme flicker while simplifying theme bootstrapping.
- Validate the deployment target for `#83` after the build is stable.

## Verification Gates

- `npm install`
- `npm run check`
- `npm run build`
- Add at least a minimal smoke test layer if the migration changes routing, metadata, or theme behavior.

## Assumptions

- No new dependency should be added unless local code or built-ins are clearly insufficient.
- Dependabot PRs will be superseded by a fresh lockfile unless a specific transitive remains pinned behind an upstream issue.
- Tailwind 4 is desirable, but not at the cost of destabilizing the decoupling work.
