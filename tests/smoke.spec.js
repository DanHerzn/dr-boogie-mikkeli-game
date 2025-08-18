// Basic e2e smoke tests for Dr Boogie game
const { test, expect } = require('@playwright/test');

async function startGame(page) {
  await page.goto('http://localhost:8000/');
  await expect(page.locator('#startScreen')).toBeVisible();
  await page.fill('#teamName', 'Test Team');
  await page.selectOption('#difficulty', 'medium');
  await page.click('#startButton');
  await expect(page.locator('#gameScreen')).toBeVisible();
  // Wait for Phaser to initialize and expose globals
  await page.waitForFunction(() => {
    return !!(window.game && window.player && window.disasters && window.powerUps && window.coordinateManager);
  });
}

test('loads and starts the game', async ({ page }) => {
  await startGame(page);
  // Ensure Phaser canvas exists
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveCount(1);
});

test('player can pick up a power up reliably', async ({ page }) => {
  await startGame(page);
  // Spawn a power-up at the player's current position
  const beforeCount = await page.evaluate(() => window.powerUps.children.entries.length);
  await page.evaluate(() => {
    const pu = window.powerUps.create(window.player.x, window.player.y, 'freeze');
    const mapCoords = window.coordinateManager.screenToMap(window.player.x, window.player.y);
    pu.originalMapX = mapCoords.x;
    pu.originalMapY = mapCoords.y;
    pu.setScale(0.12 * Math.max(0.6, window.game.scene.scenes[0].mapScale));
    if (pu.body) {
      const bodyW = pu.displayWidth;
      const bodyH = pu.displayHeight;
      pu.body.setSize(bodyW, bodyH);
      pu.body.setOffset((pu.displayWidth - bodyW) / 2, (pu.displayHeight - bodyH) / 2);
    }
  });
  // Wait for overlap to collect the power-up
  await page.waitForFunction((prev) => window.powerUps.children.entries.length <= prev, beforeCount);
});

test('player blocks a disaster reliably', async ({ page }) => {
  await startGame(page);
  const beforeScore = await page.evaluate(() => Number(document.getElementById('currentScore').textContent));
  const beforeCount = await page.evaluate(() => window.disasters.children.entries.length);
  await page.evaluate(() => {
    const d = window.disasters.create(window.player.x, window.player.y, 'meteor');
    const mapCoords = window.coordinateManager.screenToMap(window.player.x, window.player.y);
    d.originalMapX = mapCoords.x;
    d.originalMapY = mapCoords.y;
    d.setScale(0.2 * Math.max(0.5, window.game.scene.scenes[0].mapScale));
    d.setVelocity(0, 0);
    if (d.body) {
      const bodyW = d.displayWidth * 0.8;
      const bodyH = d.displayHeight * 0.8;
      d.body.setSize(bodyW, bodyH);
      d.body.setOffset((d.displayWidth - bodyW) / 2, (d.displayHeight - bodyH) / 2);
    }
  });
  // Wait for score increase or disaster count decrease
  await page.waitForFunction((prevScore, prevCount) => {
    const s = Number(document.getElementById('currentScore').textContent);
    const c = window.disasters.children.entries.length;
    return s >= prevScore + 10 || c < prevCount;
  }, beforeScore, beforeCount);
});
