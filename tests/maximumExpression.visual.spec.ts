import { test, expect } from '@playwright/test'

/**
 * Visual regression sweep: screenshots every component of the demo page in
 * every characteristic it can express ("maximum expression").
 *
 * Baselines land in tests/__screenshots__/<project>/ — delete a file (or run
 * with --update-snapshots) to accept an intentional UI change.
 */

interface VisualTestTarget {
  /** Component name — first half of the baseline filename. */
  name: string
  /** The variant being captured (tab, filter, state …) — second half. */
  characteristic: string
  /** CSS selector of the element to screenshot. */
  selector: string
  /** Optional: element to click first, driving the component into the variant. */
  clickBefore?: string
}

/*
 * Each entry becomes its own test case (see the loop below), so every target
 * must be reachable from a fresh page load — no entry may depend on state
 * left behind by another.
 */
const targets: VisualTestTarget[] = [
  {
    name: 'AppHeader',
    characteristic: 'default',
    selector: '[data-testid="header"]',
  },
  {
    name: 'Hero',
    characteristic: 'default',
    selector: '[data-testid="hero"]',
  },
  {
    name: 'TestRunner',
    characteristic: 'suite-finished',
    selector: '[data-testid="test-runner"]',
  },
  {
    name: 'TestRunner',
    characteristic: 'filter-passed',
    selector: '[data-testid="test-runner"]',
    clickBefore: '[data-testid="filter-passed"]',
  },
  {
    name: 'TestRunner',
    characteristic: 'filter-failed',
    selector: '[data-testid="test-runner"]',
    clickBefore: '[data-testid="filter-failed"]',
  },
  {
    name: 'TestRunner',
    characteristic: 'filter-all',
    selector: '[data-testid="test-runner"]',
    clickBefore: '[data-testid="filter-all"]',
  },
  {
    name: 'AppFooter',
    characteristic: 'default',
    selector: '[data-testid="footer"]',
  },
]

/** "TestRunner" + "filter-passed" → "testrunner--filter-passed.png" */
const baselineName = ({ name, characteristic }: VisualTestTarget): string =>
  `${name}--${characteristic}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-') + '.png'

// Upper bound for the mock suite's mount replay (5 specs × STEP_MS in
// TestRunner.vue ≈ 2.5s) — sized generously; adjust if the pacing changes.
const SUITE_REPLAY_TIMEOUT_MS = 10_000

test.describe('maximum expression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')

    // The runner replays its scripted suite on mount. Wait for the run
    // button to re-enable — the page is only deterministic after that.
    await expect(page.getByTestId('run-button')).toBeEnabled({
      timeout: SUITE_REPLAY_TIMEOUT_MS,
    })
  })

  // One dedicated test case per target — declared at load time, so each shows
  // up individually in reporters/UI mode and can run, retry, and fail alone.
  for (const target of targets) {
    test(`${target.name} — ${target.characteristic}`, async ({ page }) => {
      if (target.clickBefore) {
        await page.locator(target.clickBefore).click()
      }

      const component = page.locator(target.selector)
      await expect(component).toBeVisible()
      await expect(component).toHaveScreenshot(baselineName(target))
    })
  }
})
