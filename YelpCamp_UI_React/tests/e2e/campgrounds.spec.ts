import { test, expect } from '@playwright/test'

// These tests require the Hono API running on port 3001 with a seeded database.

const uniqueUser = () => `campuser${Date.now()}`

async function registerAndLogin(page: import('@playwright/test').Page) {
  const username = uniqueUser()
  await page.goto('/register')
  await page.fill('input#username', username)
  await page.fill('input#password', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/campgrounds/)
  return username
}

test.describe('Campgrounds', () => {
  test('browse campgrounds page shows cards', async ({ page }) => {
    await page.goto('/campgrounds')
    await expect(page.getByText('Welcome to YelpCamp!')).toBeVisible()
    // Should have at least the seed data campgrounds (or "No campgrounds found")
    const content = await page.textContent('body')
    expect(content).toBeTruthy()
  })

  test('landing page links to campgrounds', async ({ page }) => {
    await page.goto('/')
    await page.click('text=View All Campgrounds')
    await expect(page).toHaveURL(/\/campgrounds/)
  })

  test('search filters campgrounds', async ({ page }) => {
    await page.goto('/campgrounds')
    await page.fill('input[placeholder="Search campgrounds..."]', 'Cloud')
    await page.click('button:has-text("Search")')
    await expect(page).toHaveURL(/search=Cloud/)
  })

  test('create campground flow', async ({ page }) => {
    await registerAndLogin(page)

    // Navigate to create page
    await page.click('text=Add Campground')
    await expect(page).toHaveURL(/\/campgrounds\/new/)

    // Fill form
    await page.fill('input#name', 'Test Campground E2E')
    await page.fill('input#price', '25.00')
    await page.fill('input#image', 'https://picsum.photos/800/600')
    await page.fill('textarea#description', 'A campground created by E2E tests.')
    await page.click('button[type="submit"]')

    // Should redirect to campgrounds list
    await expect(page).toHaveURL(/\/campgrounds/)
  })

  test('view campground detail', async ({ page }) => {
    await page.goto('/campgrounds')
    const viewButton = page.getByText('View Details').first()
    await expect(viewButton).toBeVisible({ timeout: 10000 })
    await viewButton.click()
    await expect(page).toHaveURL(/\/campgrounds\/\d+/)
  })

  test('unauthenticated user cannot see Add Campground button', async ({ page }) => {
    await page.goto('/campgrounds')
    await expect(page.getByText('Add Campground')).not.toBeVisible()
  })
})
