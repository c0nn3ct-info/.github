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
