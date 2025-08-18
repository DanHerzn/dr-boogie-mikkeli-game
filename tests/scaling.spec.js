const { test, expect } = require('@playwright/test');

async function startGame(page) {
  await page.goto('http://localhost:8000/');
  await expect(page.locator('#startScreen')).toBeVisible();
  await page.fill('#teamName', 'Scale Test');
  await page.selectOption('#difficulty', 'medium');
  await page.click('#startButton');
  await expect(page.locator('#gameScreen')).toBeVisible();
  await page.waitForFunction(() => !!(window.game && window.coordinateManager && window.player));
}

test.describe('Scaling and centering', () => {
  test('desktop viewport fits and centers map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await startGame(page);

    const fit = await page.evaluate(() => {
      const b = window.coordinateManager.getMapBounds();
      const w = window.innerWidth; const h = window.innerHeight;
      // Map must be fully inside viewport
      const inside = b.left >= 0 && b.top >= 0 && b.right <= w + 1 && b.bottom <= h + 1; // allow 1px rounding
      // Map should be centered along at least one axis
      const centeredX = Math.abs((w - (b.right - b.left)) / 2 - b.left) < 3;
      const centeredY = Math.abs((h - (b.bottom - b.top)) / 2 - b.top) < 3;
      return { inside, centeredX, centeredY };
    });

    expect(fit.inside).toBeTruthy();
    expect(fit.centeredX || fit.centeredY).toBeTruthy();
  });

  test('mobile portrait and landscape keep elements within bounds', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 portrait-like
    await startGame(page);

    // Ensure player within bounds
    const inBoundsPortrait = await page.evaluate(() => {
      const b = window.coordinateManager.getMapBounds();
      return window.player.x >= b.left && window.player.x <= b.right && window.player.y >= b.top && window.player.y <= b.bottom;
    });
    expect(inBoundsPortrait).toBeTruthy();

    // Simulate orientation change by swapping viewport
    await page.setViewportSize({ width: 844, height: 390 });
    // Wait for player to be clamped inside bounds and map to fit
    await page.waitForFunction(() => {
      const b = window.coordinateManager.getMapBounds();
      const eps = 2;
      const inBounds = window.player.x >= b.left - eps && window.player.x <= b.right + eps && window.player.y >= b.top - eps && window.player.y <= b.bottom + eps;
      const w = window.innerWidth; const h = window.innerHeight;
      const fit = b.left >= -1 && b.top >= -1 && b.right <= w + 1 && b.bottom <= h + 1;
      return inBounds && fit;
    }, null, { timeout: 2000 });
  });
});
