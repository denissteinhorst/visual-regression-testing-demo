import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

/**
 * Prints the self-contained Playwright HTML report to a timestamped A4 PDF,
 * placed next to the report's index.html in `playwright-report/`.
 *
 * Chained into `ci:test`, so every Docker test run — pass or fail — ships
 * with a matching PDF. Runs on the host, not in Docker: the PDF is a print
 * of the report UI, not a visual baseline, so the pinned render environment
 * doesn't apply. Executed directly via Node's native type stripping.
 */

// The self-contained report the `html` reporter writes after every run.
const REPORT_HTML = resolve('playwright-report/index.html')

/** @returns Filesystem-safe German timestamp, e.g. "17.07.2026_14-32" */
const germanTimestamp = (now: Date = new Date()): string => {
  const date = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${date}_${time.replace(':', '-')}`
}

const exportReportPdf = async (): Promise<void> => {
  if (!existsSync(REPORT_HTML)) {
    throw new Error(`No report at ${REPORT_HTML} — run "npm run ci:test" first.`)
  }

  const pdfPath = resolve('playwright-report', `report_${germanTimestamp()}.pdf`)
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(REPORT_HTML).href)
    // The report is a client-side app — wait until it has hydrated the DOM.
    await page.waitForSelector('#root > *')
    // Keep the on-screen styling; the report ships no print stylesheet.
    await page.emulateMedia({ media: 'screen' })

    await page.pdf({
      path: pdfPath,
      // Plain printable A4, portrait.
      format: 'A4',
      // Status chips and diff thumbnails are CSS backgrounds — keep them visible.
      printBackground: true,
      // Uniform margin so nothing sits flush against the paper edge.
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    })

    console.log(`PDF written: ${pdfPath}`)
  } finally {
    await browser.close()
  }
}

await exportReportPdf()
