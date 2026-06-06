import { test, expect } from '@playwright/test'

test.describe('Establishments', () => {
  test('lists existing establishments', async ({ page }) => {
    await page.goto('/establishments')
    await expect(page.getByText('DNV Orthocare')).toBeVisible()
    await expect(page.getByText('Sri Ranga Department Store')).toBeVisible()
  })

  test('shows establishment type badges', async ({ page }) => {
    await page.goto('/establishments')
    await expect(page.getByText('HOSPITAL').first()).toBeVisible()
    await expect(page.getByText('SHOP').first()).toBeVisible()
  })

  test('new establishment page loads', async ({ page }) => {
    await page.goto('/establishments/new')
    await expect(page.getByText('New Establishment')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Establishment' })).toBeVisible()
  })

  test('create establishment - validation fails on empty submit', async ({ page }) => {
    await page.goto('/establishments/new')
    await page.getByRole('button', { name: /Create Establishment/i }).click()
    // Browser native validation on required field — Name input exists and has required attr
    const nameInput = page.getByLabel('Name', { exact: true })
    await expect(nameInput).toHaveAttribute('required')
  })

  test('create and view a new establishment', async ({ page }) => {
    await page.goto('/establishments/new')
    await page.getByLabel('Name', { exact: true }).fill('Test Clinic')
    await page.getByLabel('Type', { exact: true }).selectOption('HOSPITAL')
    await page.getByLabel('Address', { exact: true }).fill('123 Test St, Chennai')
    await page.getByLabel('Employer Name', { exact: true }).fill('Dr. Test')
    await page.getByLabel('Manager Name', { exact: true }).fill('Manager Test')
    await page.getByLabel('Reg Cert No', { exact: true }).fill('TN-TEST-001')
    await page.getByRole('button', { name: /Create Establishment/i }).click()
    await expect(page).toHaveURL(/\/establishments/)
    await expect(page.getByText('Test Clinic').first()).toBeVisible()
  })

  test('edit establishment', async ({ page }) => {
    await page.goto('/establishments')
    const row = page.locator('tr', { hasText: 'DNV Orthocare' }).first()
    await row.getByRole('link', { name: /Edit/i }).click()
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue('DNV Orthocare')
    // Change manager name
    await page.getByLabel('Manager Name', { exact: true }).fill('Ramesh Kumar Updated')
    await page.getByRole('button', { name: /Save Changes/i }).click()
    await expect(page).toHaveURL(/\/establishments/)
    // Revert it back
    await page.goto('/establishments')
    const row2 = page.locator('tr', { hasText: 'DNV Orthocare' }).first()
    await row2.getByRole('link', { name: /Edit/i }).click()
    await page.getByLabel('Manager Name', { exact: true }).fill('Ramesh Kumar')
    await page.getByRole('button', { name: /Save Changes/i }).click()
  })
})
