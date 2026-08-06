import { test, expect } from '@playwright/test'

// TEC-51 — Help page search caused the page to blink/disappear: every keystroke
// synchronously recomputed the match set and forced every <details> section's
// open/closed state plus a display:none toggle on its wrapper, so a fast typing
// burst could snap the whole results container down to ~0 content and back.
//
// Fix: filtering/open-state is now driven off a 300ms-debounced copy of the query,
// and section summary rows are never display:none'd — only their `open` (expanded)
// state responds to the query, so the results container always keeps its full set
// of title rows mounted and visible.

test.describe('Help page search — no blink/disappear (TEC-51)', () => {
  test('all sections are present and search filters/expands without hiding rows', async ({ page }) => {
    await page.goto('/help')

    const summaries = page.locator('summary')
    const expectedCount = await summaries.count()
    expect(expectedCount).toBeGreaterThan(0)

    const container = page.locator('.rounded.border.border-\\[\\#1e2d3d\\].bg-\\[\\#0a1520\\]')
    await expect(container).toBeVisible()

    const search = page.getByLabel('Search help')

    // Type a query character-by-character, simulating a fast real keystroke burst.
    // At every step: the summary row count must stay constant (no remount/unmount),
    // and the results container must never collapse to near-zero height (no
    // "everything disappears" blink), because summary rows are always shown —
    // only their expanded state is debounced.
    const query = 'wage'
    for (let i = 1; i <= query.length; i++) {
      await search.pressSequentially(query[i - 1], { delay: 60 })
      await expect(summaries).toHaveCount(expectedCount)
      const box = await container.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThan(50)
    }

    // After typing settles (debounce fires), the matching section is expanded.
    await page.waitForTimeout(400) // let the 300ms debounce settle fully
    await expect(page.getByText(/matching section/i)).toBeVisible()
    const wageFormulaDetails = page.locator('#wage-formula')
    await expect(wageFormulaDetails).toHaveJSProperty('open', true)

    // Clearing restores the full, unfiltered view immediately (no stale filtered
    // state lingering while a debounce would otherwise still be in flight).
    await page.getByLabel('Clear search').click()
    await expect(summaries).toHaveCount(expectedCount)
    await expect(page.getByText(/matching section/i)).not.toBeVisible()
  })
})
