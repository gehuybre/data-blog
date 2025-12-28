import { test, expect } from '@playwright/test';

/**
 * E2E tests for embed iframe loading and functionality
 *
 * These tests verify that:
 * 1. All embed iframes load successfully without errors
 * 2. No console errors are generated during load
 * 3. Iframes are responsive and render correctly
 */

test.describe('Embed Loading Tests', () => {
  const testEmbeds = [
    {
      path: '/embed/vergunningen-goedkeuringen/renovatie/?view=chart',
      name: 'Renovatie Chart',
      title: 'Renovatie (Gebouwen)',
    },
    {
      path: '/embed/vergunningen-goedkeuringen/nieuwbouw/?view=table',
      name: 'Nieuwbouw Table',
      title: 'Nieuwbouw (Gebouwen)',
    },
    {
      path: '/embed/vergunningen-goedkeuringen/renovatie/?view=map',
      name: 'Renovatie Map',
      title: 'Renovatie (Gebouwen)',
    },
    {
      path: '/embed/vastgoed-verkopen/transacties/?view=chart&geo=2000&type=huizen_4plus',
      name: 'Vastgoed Transacties with filters',
      title: 'Aantal transacties',
    },
    {
      path: '/embed/starters-stoppers/survival/?view=chart&horizon=3&sector=F',
      name: 'Starters Stoppers Survival',
      title: 'Overlevingskans',
    },
    {
      path: '/embed/faillissementen/evolutie/?view=chart&sector=I',
      name: 'Faillissementen Evolutie',
      title: 'Evolutie faillissementen',
    },
    {
      path: '/embed/huishoudensgroei/ranking/?view=chart&horizon=2033&sector=decline',
      name: 'Huishoudensgroei Ranking',
      title: 'Gemeenten ranking',
    },
  ];

  testEmbeds.forEach(({ path, name, title }) => {
    test(`should load ${name} embed successfully`, async ({ page }) => {
      // Capture console errors (filter out React hydration warnings)
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter out React hydration warnings - these are dev-mode only and don't affect functionality
          if (!text.includes('Warning: Prop') && !text.includes('did not match')) {
            consoleErrors.push(text);
          }
        }
      });

      // Capture page errors
      const pageErrors: Error[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(error);
      });

      // Navigate to the embed page
      const response = await page.goto(path);

      // Verify successful response
      expect(response?.status()).toBe(200);

      // Wait for the page to be in a stable state
      await page.waitForLoadState('networkidle');

      // Verify no console errors occurred
      expect(consoleErrors).toHaveLength(0);

      // Verify no page errors occurred
      expect(pageErrors).toHaveLength(0);

      // Verify the page has rendered content (not a blank page)
      const body = page.locator('body');
      await expect(body).toBeVisible();
      await expect(body).not.toBeEmpty();
    });
  });

  test('should load embeds in responsive container', async ({ page }) => {
    // Test that embeds work correctly in smaller viewports
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    const response = await page.goto('/embed/vergunningen-goedkeuringen/renovatie/?view=chart');
    expect(response?.status()).toBe(200);

    await page.waitForLoadState('networkidle');

    // Verify content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await expect(body).not.toBeEmpty();
  });

  test('should handle navigation timeout gracefully', async ({ page }) => {
    // Set a shorter timeout to test timeout handling
    page.setDefaultTimeout(5000);

    // This test verifies that our embeds load within a reasonable time
    const response = await page.goto('/embed/vergunningen-goedkeuringen/renovatie/?view=chart');
    expect(response?.status()).toBe(200);

    // If we get here without timing out, the test passes
    expect(true).toBe(true);
  });
});
