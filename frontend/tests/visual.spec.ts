import { test, expect } from '@playwright/test'

test('home page should match snapshot', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('home.png', { fullPage: true })
})

test('practice page should match snapshot', async ({ page }) => {
  await page.goto('/practice')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('practice.png', { fullPage: true })
})

test('content page should match snapshot', async ({ page }) => {
  await page.goto('/content')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('content.png', { fullPage: true })
})

test('goals page should match snapshot', async ({ page }) => {
  await page.goto('/goals')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('goals.png', { fullPage: true })
})

test('settings page should match snapshot', async ({ page }) => {
  await page.goto('/settings')
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page).toHaveScreenshot('settings.png', { fullPage: true })
})
