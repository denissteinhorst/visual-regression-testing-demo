# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small Vue 3 demo page that serves as a stable target for Playwright visual regression testing. The core design: **all screenshot rendering happens inside one Docker image** (`mcr.microsoft.com/playwright:v1.61.1-noble`), so baselines and comparisons come from identical engines. Baselines are rendered from local code, comparisons always run against prod (`https://steinhorst.dev/repos/visual-regression-testing-demo/`).

## Commands

Requires Node 24 (`nvm use 24`) and Docker Desktop.

- `npm run dev` — Vite dev server on http://localhost:5173
- `npm run build` — static build into `dist/`
- `npm run typecheck` — `tsc --noEmit` over the Playwright config, specs, and scripts
- `npm run ci:test` — pipeline gate: builds the Docker image and compares **prod** against the committed baselines; always chains `report:pdf` afterwards
- `npm run ci:test:update` — regenerates baselines from **local** code; the dev server must already be running (`npm run dev`) so the container can reach it via `host.docker.internal`
- `npm run report:pdf` — prints `playwright-report/index.html` to a timestamped A4 PDF (runs on the host via Node's native TS type stripping)

### Running a single test

Inside Docker (pixel-accurate, matches committed baselines):

```bash
npm run docker:build
docker run --rm --ipc=host vrt-runner npx playwright test -g "TestRunner" --project=chromium
```

Outside Docker, Playwright UI mode works for developing specs (one-time `npx playwright install`), but macOS-rendered screenshots will NOT match the committed Linux baselines — use it for locators and flow only:

```bash
BASE_URL=http://localhost:5173/ npx playwright test --ui
```

`BASE_URL` must keep its trailing slash — specs navigate with `page.goto('./')`, which resolves relative to it.

## Architecture

### Baseline data flow (the key non-obvious part)

The two test commands move baselines in opposite directions:

- **`ci:test:update` — live mount, results flow out.** Mounts `./tests` into the container; the run writes fresh PNGs through the mount directly into `tests/__screenshots__/`, ready to review and commit.
- **`ci:test` — baked copy, baselines flow in.** The Dockerfile `COPY`s the committed `tests/` into the image at build time (that's why the script always rebuilds — cached, seconds). Only `playwright-report/` is mounted out so diff images survive the container.

Consequence: a failing `ci:test` means either the deploy didn't ship what's committed, or the UI changed without re-blessed baselines. Fresh baselines only go green after the code they were rendered from is deployed. Intentional UI changes ship code + regenerated baselines **in the same commit** — prod is never a baseline source.

### Test structure

There is one spec, [tests/maximumExpression.visual.spec.ts](tests/maximumExpression.visual.spec.ts), which is table-driven: a `targets` array of `{name, characteristic, selector, clickBefore?}` entries, each becoming its own test case. To cover a new component or variant, add an entry to that array — don't write new spec boilerplate. Every target must be reachable from a fresh page load (no cross-entry state). Targets with `clickBefore` also capture a `--full-page` screenshot after the click.

`playwright.config.ts` defines five projects — `chromium`, `firefox`, `safari`, `ipad`, `iphone` — each with its own baseline set under `tests/__screenshots__/<project>/` (via `snapshotPathTemplate`). Only `*.visual.spec.ts` files match (`testMatch`), leaving room for functional `*.spec.ts` later. Animations and the caret are frozen globally in the config.

The demo page's `TestRunner.vue` replays a scripted mock suite on mount; the `beforeEach` waits for the run button to re-enable before any screenshot — the page is only deterministic after that.

### Constraints to preserve

- The Dockerfile's Playwright image tag **must match** the `@playwright/test` version in package.json, or the runner won't find its browsers.
- `vite.config.js` needs `allowedHosts: ['host.docker.internal']` and the module `warmup` list — the warmup prevents WebKit `page.goto` flake on cold first Docker runs.
- `base: './'` in the Vite config keeps the build deployable to any subfolder.
