import { defineConfig, devices } from '@playwright/test'

// Switches the target environment; set via the ci:test:* npm scripts.
const isProd = process.env.TEST_ENV === 'prod'

// Where the vite dev server listens during local runs.
const LOCAL_URL = 'http://localhost:5173/'

// Deployed static build. Trailing slash is required so relative
// navigation (page.goto('./')) resolves to the subfolder, not the domain root.
const PROD_URL = 'https://steinhorst.dev/repos/visual-regression-testing-demo/'

export default defineConfig({
  // All Playwright specs live here.
  testDir: './tests',
  // Only visual specs for now — keeps room for functional *.spec.ts later.
  testMatch: '**/*.visual.spec.ts',
  // Baselines grouped per project: tests/__screenshots__/<browser>/<name>.png
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  // Specs are independent, so parallel workers are safe.
  fullyParallel: true,
  // One retry absorbs the odd rendering hiccup without hiding real diffs.
  retries: 1,
  // Terse locally; line output reads best in CI logs too.
  reporter: 'line',

  expect: {
    toHaveScreenshot: {
      // Freeze CSS animations/transitions — moving pixels can't be a baseline.
      animations: 'disabled',
      // Hide the text caret for the same reason.
      caret: 'hide',
    },
  },

  use: {
    // Every page.goto() in the specs resolves relative to this.
    baseURL: isProd ? PROD_URL : LOCAL_URL,
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

  // Local runs boot the dev server themselves; prod runs hit the live site.
  webServer: isProd
    ? undefined
    : {
        command: 'npm run dev',
        url: LOCAL_URL,
        // Reuse a dev server you already have running instead of failing.
        reuseExistingServer: true,
      },
})
