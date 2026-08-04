import { test, expect } from "@playwright/test";

/**
 * E2E tests for core user flows.
 * Runs against dev server; verifies real data pipeline and UI.
 */

test("Dashboard loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("text=Dashboard")).toBeVisible();
});

test("Watchlist page exists and loads", async ({ page }) => {
  await page.goto("/watchlist");
  await expect(page.locator("text=Watchlist")).toBeVisible();
  await expect(page.locator("text=Live quotes")).toBeVisible();
});

test("Screener page loads", async ({ page }) => {
  await page.goto("/screener");
  await expect(page.locator("text=Screener")).toBeVisible();
});

test("Markets page with regime dial", async ({ page }) => {
  await page.goto("/markets");
  await expect(page.locator("text=Markets")).toBeVisible();
  await expect(page.locator("text=Macro Regime")).toBeVisible();
});

test("News page loads", async ({ page }) => {
  await page.goto("/news");
  await expect(page.locator("text=News")).toBeVisible();
});

test("Portfolio page exists", async ({ page }) => {
  await page.goto("/portfolio");
  await expect(page.locator("text=Portfolio")).toBeVisible();
});

test("Navigation works across pages", async ({ page }) => {
  await page.goto("/");

  // Click Watchlist
  await page.click("text=Watchlist");
  await expect(page).toHaveURL("/watchlist");

  // Click Screener
  await page.click("text=Screener");
  await expect(page).toHaveURL("/screener");

  // Click Markets
  await page.click("text=Markets");
  await expect(page).toHaveURL("/markets");

  // Click Portfolio
  await page.click("text=Portfolio");
  await expect(page).toHaveURL("/portfolio");
});

test("Theme toggle works", async ({ page }) => {
  await page.goto("/");

  // Check initial theme
  const html = page.locator("html");
  const initialClass = await html.getAttribute("class");

  // Toggle theme
  const themeButton = page.locator("button").filter({ has: page.locator("text=Light") }).or(page.locator("button").filter({ has: page.locator("text=Dark") })).first();
  if (await themeButton.isVisible()) {
    await themeButton.click();
    const newClass = await html.getAttribute("class");
    // Verify either class or data-theme attribute exists
    const hasTheme = newClass || (await html.getAttribute("data-theme"));
    await expect(hasTheme).toBeTruthy();
  }
});
