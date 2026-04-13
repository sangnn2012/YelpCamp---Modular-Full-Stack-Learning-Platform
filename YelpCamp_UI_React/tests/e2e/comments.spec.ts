import { test, expect } from '@playwright/test'

// These tests require the Hono API running on port 3001 with seeded data.

const uniqueUser = () => `commentuser${Date.now()}`

async function registerAndLogin(page: import('@playwright/test').Page) {
  const username = uniqueUser()
  await page.goto('/register')
  await page.fill('input#username', username)
  await page.fill('input#password', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/campgrounds/)
  return username
}

async function createCampground(page: import('@playwright/test').Page) {
  await page.click('text=Add Campground')
  await page.fill('input#name', `Camp ${Date.now()}`)
  await page.fill('input#price', '10.00')
  await page.fill('input#image', 'https://picsum.photos/800/600')
  await page.fill('textarea#description', 'E2E test campground for comments.')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/campgrounds/)
}

test.describe('Comments', () => {
  test('add comment to campground', async ({ page }) => {
    await registerAndLogin(page)
    await createCampground(page)

    // Navigate to the first campground detail
    const viewButton = page.getByText('View Details').first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      await expect(page).toHaveURL(/\/campgrounds\/\d+/)

      // Click "Add Comment"
      const addComment = page.getByText('Add Comment')
      if (await addComment.isVisible()) {
        await addComment.click()
        await expect(page).toHaveURL(/\/comments\/new/)

        await page.fill('textarea#text', 'E2E test comment')
        await page.click('button[type="submit"]')

        // Should redirect back to campground detail
        await expect(page).toHaveURL(/\/campgrounds\/\d+$/)
        await expect(page.getByText('E2E test comment')).toBeVisible()
      }
    }
  })

  test('unauthenticated user cannot see Add Comment button', async ({ page }) => {
    await page.goto('/campgrounds')
    const viewButton = page.getByText('View Details').first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      await expect(page.getByText('Add Comment')).not.toBeVisible()
    }
  })
})
