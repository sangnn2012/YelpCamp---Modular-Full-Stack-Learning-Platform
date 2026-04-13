import { test, expect } from '@playwright/test'

// These tests require the Hono API running on port 3001 with a seeded database.
// Run: cd ../YelpCamp_API_Hono && bun run db:seed && bun run dev

const uniqueUser = () => `testuser${Date.now()}`

test.describe('Authentication', () => {
  test('register new user and land on campgrounds page', async ({ page }) => {
    const username = uniqueUser()
    await page.goto('/register')
    await page.fill('input#username', username)
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')

    // Should redirect to /campgrounds and show welcome flash
    await expect(page).toHaveURL(/\/campgrounds/)
    await expect(page.getByText(username)).toBeVisible()
  })

  test('login existing user', async ({ page }) => {
    // First register
    const username = uniqueUser()
    await page.goto('/register')
    await page.fill('input#username', username)
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/campgrounds/)

    // Logout
    await page.click('text=Logout')

    // Login
    await page.goto('/login')
    await page.fill('input#username', username)
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/campgrounds/)
    await expect(page.getByText(username)).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    const username = uniqueUser()
    await page.goto('/register')
    await page.fill('input#username', username)
    await page.fill('input#password', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/campgrounds/)

    await page.click('text=Logout')

    // Should see Login/Sign Up
    await expect(page.getByText('Login')).toBeVisible()
    await expect(page.getByText('Sign Up')).toBeVisible()
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/campgrounds/new')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#username', 'nonexistent')
    await page.fill('input#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should stay on login page (or show error)
    await expect(page).toHaveURL(/\/login/)
  })
})
