import { defineConfig, devices } from '@playwright/test'

/*
 * All test runs happen inside the project's Docker container, so there is
 * exactly one render environment and one committed baseline set:
 *   - baselines are rendered from the LOCAL dev server (BASE_URL override)
 *   - comparisons always run against the deployed prod site (the default)
 */

// Comparison target. Trailing slash is required so relative navigation
// (page.goto('./')) resolves to the subfolder, not the domain root.
const PROD_URL = 'https://steinhorst.dev/repos/visual-regression-testing-demo/'

export default defineConfig({
  // All Playwright specs live here.
  testDir: './tests',
  // Only visual specs for now — keeps room for functional *.spec.ts later.
  testMatch: '**/*.visual.spec.ts',
  // One baseline set, grouped per browser: tests/__screenshots__/<browser>/<name>.png
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  // Specs are independent, so parallel workers are safe.
  fullyParallel: true,
  // The page is deterministic and animations are frozen, so a diff is a
  // diff — no retries locally. In the container (CI=1) one retry absorbs
  // network flake against the live prod site.
  retries: process.env.CI ? 1 : 0,
  // Line output for logs, plus an HTML report with the visual diffs —
  // the report folder is the artifact to archive in the pipeline step.
  reporter: [['line'], ['html', { open: 'never' }]],

  expect: {
    toHaveScreenshot: {
      // Freeze CSS animations/transitions — moving pixels can't be a baseline.
      animations: 'disabled',
      // Hide the text caret for the same reason.
      caret: 'hide',
    },
  },

  use: {
    // Default: compare against prod. The baseline script overrides BASE_URL
    // to render the host's dev server (http://host.docker.internal:5173/).
    baseURL: process.env.BASE_URL ?? PROD_URL,
    // Keep traces only for failed runs — free to record, invaluable to debug.
    trace: 'retain-on-failure',
  },

  /*
   * One project per target renderer. iPad/iPhone run on WebKit too, but with
   * real device metrics (viewport, DPR, touch) — so they earn their own baselines.
   */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
  ],
})
