# c0nn3ct.info site

The identity page served at <https://c0nn3ct.info>. Vite + React + Tailwind, prerendered to
static HTML by `scripts/prerender.mjs` and deployed to GitHub Pages by
`.github/workflows/deploy.yml` in the repository root.

```bash
npm ci
npm run build    # tsc --noEmit && vite build && prerender into dist/
npm test         # vitest; coverage must stay at 100% on all four metrics
npm run lint     # eslint, zero warnings
```

## Languages

Six locales: `en`, `ru`, `es`, `zh-CN`, `fa`, `ar`. English is served at the root and the rest
under `/<locale>/`; `fa` and `ar` are right-to-left. Every dictionary carries an identical key set,
and a test fails the build if one drifts.

Adding a locale means a dictionary in `src/i18n/`, route shells under `pages/<locale>/`, and the
locale list in three places that cannot import one another: `src/i18n/index.ts`, `vite.config.ts`,
and `scripts/prerender-core.mjs` (which also needs its `OG_LOCALE` entry).

## Copy

All text lives in `src/i18n/*.json`. Change it there, never in a component. The page's claims are
meant to be checkable against the products, so keep new copy to things a reader could hold us to,
and avoid universal present-tense promises that a future product would break.
