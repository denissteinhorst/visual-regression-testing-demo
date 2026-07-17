# visual-regression-testing-demo

A small Vue 3 demo page used as a stable target for Playwright visual
regression testing. All tests render inside one Docker image, so there is a
single source of truth: **baselines come from your local code, comparisons
always run against prod** — both through the exact same engines.

## Project structure

```
src/                  the demo page (Vue 3, no runtime deps besides vue)
tests/                Playwright specs + committed baseline screenshots
playwright.config.ts  five browser/device projects, prod as default target
Dockerfile            the single render environment for all test runs
```

## Installation

Requires Node 24 (`nvm use 24`) and Docker Desktop.

```bash
npm install
```

## Commands

| Command                  | What it does                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | Vite dev server on <http://localhost:5173>                                                                             |
| `npm run build`          | Static build in `dist/` — upload its contents to the webserver                                                         |
| `npm run ci:test`        | Compare **prod** against the committed baselines (pipeline gate)                                                       |
| `npm run ci:test:update` | Regenerate the baselines from your **local** code                                                                      |
| `npm run typecheck`      | Type-check the Playwright config and specs (`tsc --noEmit`)                                                            |
| `npm run report:pdf`     | Print the HTML report to `playwright-report/report_<TT.MM.JJJJ>_<hh-mm>.pdf` (A4) — runs automatically after `ci:test` |

Both test commands build the Docker image (cached after the first ~2 GB pull)
and run every `*.visual.spec.ts` across five projects: `chromium`, `firefox`,
`safari`, `ipad`, `iphone`. Baselines live in
`tests/__screenshots__/<browser>/` and are committed to git.

## Technical behaviour

**Getting the project into the image.** The Dockerfile copies
`package.json`/`package-lock.json` first and runs `npm ci` on its own layer,
then copies in `playwright.config.ts` and the whole `tests/` folder — specs
and committed baselines both. That ordering means editing a spec or a
baseline only busts the cheap final layer; `npm ci` is never repeated just
because a test changed, which is why both commands can afford to rebuild the
image on every run. The image is fully self-contained once built: it carries
its own copy of the test code, it doesn't read from the host unless a volume
is explicitly mounted.

**Matching screenshots to the right browser.** `snapshotPathTemplate` in
`playwright.config.ts` places each baseline at
`tests/__screenshots__/<projectName>/<name>.png`, so `chromium`, `firefox`,
`safari`, `ipad`, and `iphone` each get their own independent baseline set — a
Chromium render is never diffed against a WebKit baseline. During `ci:test`,
Playwright screenshots the running target and pixel-compares it against the
baseline at that path; any mismatch writes an actual/expected/diff triptych
into `playwright-report/`.

The two test commands then move those baselines in opposite directions:

- **`ci:test:update` — live mount, results flow _out_.** The script mounts the
  repo's `./tests` folder into the container (`-v $(pwd)/tests:/app/tests`).
  The container renders your locally running dev server (hence
  `npm run dev -- --host`) and writes the PNGs straight through the mount into
  `tests/__screenshots__/` — when the run finishes, the new baselines are
  already in git's working tree, ready to review and commit. Nothing is
  copied afterwards.

- **`ci:test` — baked copy, baselines flow _in_.** The Dockerfile's
  `COPY tests ./tests` bakes the committed baselines into the image at build
  time. That's why the script always runs `docker build` first: the build is
  cached and takes seconds, but it guarantees the container compares prod
  against the baselines exactly as they exist in the repo right now. The only
  thing mounted _out_ is `playwright-report/`, so the diff images survive the
  discarded container.

A practical consequence of the baked-in approach: a CI runner needs nothing
but the repo checkout and Docker — no Node, no `npm install` on the runner.

## The workflow

Develop → bless → deploy → verify:

```bash
# 1. Work on the components, check them in the browser
npm run dev

# 2. Bless the new look: render fresh baselines from your local code.
#    The container reaches your dev server via host.docker.internal,
#    so it must be running and listening on all interfaces:
npm run dev -- --host        # keep running in a second terminal
npm run ci:test:update

# 3. Review the changed PNGs, then commit code + baselines together and push

# 4. Deploy: npm run build, upload dist/ contents

# 5. Verify (or let the pipeline do it): prod must now match the baselines
npm run ci:test
```

A failing `ci:test` therefore means exactly one of two things: the deploy
didn't ship what's committed, or the UI changed without re-blessed baselines.
The same rule covers fresh baselines: `ci:test` only goes green once the
state they were rendered from has been deployed (steps 4–5) — until then the
compare run correctly fails against the older build on prod.

## Intentional UI changes

That's simply steps 2–5 again: every deliberate visual change ships **in the
same commit** as its regenerated baselines. Prod is never a baseline source —
baselines always come from local code, so they go through review _before_ the
change is live, and the pipeline stays green after the deploy.

## Pipeline usage

The pipeline step is `npm run ci:test` (or the underlying `docker build` +
`docker run` directly). The run exits non-zero on any visual diff and writes
`playwright-report/` next to the project — archive that folder as the build
artifact; it contains the actual/expected/diff images for every failure.

## Debugging specs

For interactively developing the specs themselves, Playwright's UI mode works
outside Docker (one-time `npx playwright install` needed). It targets prod by
default; point it elsewhere with `BASE_URL`:

```bash
BASE_URL=http://localhost:5173/ npx playwright test --ui
```

Note that screenshots rendered on macOS won't match the committed Linux
baselines — use UI mode for locators and flow, not for pixel verdicts.

## Disclaimer

This repository was created entirely with AI-assisted code generation. Rather than writing the code manually, I focused on defining the project's goals, architecture, implementation strategy, and expected behavior. Through iterative prompting, detailed technical guidance, code reviews, and design decisions, I steered the AI toward the final result. The code itself was generated by AI; my contribution was directing, refining, and validating the implementation.
