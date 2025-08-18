/**
 * Mobile Orientation and Scaling Handler
 * Robust orientation handling and transform updates for mobile.
 */

class MobileHandler {
    constructor() {
        this.isInitialized = false;
        this.gameScene = null;
        this.originalMapDimensions = { width: 1200, height: 800 };
        this.debounceTimer = null;
        this.isRecalculating = false;
        this.trackedElements = [];
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        ('ontouchstart' in window) ||
                        (navigator.maxTouchPoints > 0);
        this.init();
    }

    init() {
        if (this.isInitialized || !this.isMobile) return;
        this.setupViewport();
        this.setupOrientationHandling();
        this.isInitialized = true;
        console.log('MobileHandler initialized');
    }

    setGameScene(scene) {
        this.gameScene = scene;
        if (scene && scene.mapSprite) {
            this.originalMapDimensions.width = scene.mapSprite.width;
            this.originalMapDimensions.height = scene.mapSprite.height;
        }
    }

    setupViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }

    setupOrientationHandling() {
        const handler = () => this.handleOrientationChange();
        if (screen.orientation && screen.orientation.addEventListener) {
            screen.orientation.addEventListener('change', handler);
        }
        window.addEventListener('orientationchange', handler);
        window.addEventListener('resize', handler);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handler);
        }
    }

    handleOrientationChange() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.performOrientationRecalculation(), 200);
    }

    addElementToTrack(element, type, data = {}) {
        this.trackedElements.push({ element, type, data });
    }

    async performOrientationRecalculation() {
        if (!this.gameScene || this.isRecalculating) return;
        this.isRecalculating = true;
        try {
            this.updateScreenDimensions();
            await this.recalculateMapScaling();
            await this.updateAllGameElements();
            await this.refreshCollisionSystems();
            await this.updateUIElements();
        } catch (e) {
            console.error('Orientation recalculation error:', e);
        } finally {
            this.isRecalculating = false;
        }
    }

    updateScreenDimensions() {
        if (window.game && window.game.scale) {
            window.game.scale.resize(window.innerWidth, window.innerHeight);
        }
    }

    async recalculateMapScaling() {
        return new Promise((resolve) => {
            if (!this.gameScene) return resolve();
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // Prefer CoordinateManager to keep scaling consistent with the rest of the app
            let scale;
            if (window.coordinateManager && typeof window.coordinateManager.calculateOptimalScale === 'function') {
                scale = window.coordinateManager.calculateOptimalScale(screenWidth, screenHeight, true);
            } else {
                const scaleX = screenWidth / this.originalMapDimensions.width;
                const scaleY = screenHeight / this.originalMapDimensions.height;
                scale = Math.min(scaleX, scaleY);
            }

            let offsets;
            if (window.coordinateManager && typeof window.coordinateManager.calculateCenteredOffset === 'function') {
                offsets = window.coordinateManager.calculateCenteredOffset(scale, screenWidth, screenHeight);
            } else {
                const scaledW = this.originalMapDimensions.width * scale;
                const scaledH = this.originalMapDimensions.height * scale;
                offsets = { offsetX: (screenWidth - scaledW) / 2, offsetY: (screenHeight - scaledH) / 2 };
            }

            this.gameScene.mapScale = scale;
            this.gameScene.mapOffsetX = offsets.offsetX;
            this.gameScene.mapOffsetY = offsets.offsetY;
            this.gameScene.mapWidth = this.originalMapDimensions.width * scale;
            this.gameScene.mapHeight = this.originalMapDimensions.height * scale;

            if (this.gameScene.mapSprite) {
                this.gameScene.mapSprite.setOrigin(0, 0);
                this.gameScene.mapSprite.setScale(scale);
                this.gameScene.mapSprite.x = this.gameScene.mapOffsetX;
                this.gameScene.mapSprite.y = this.gameScene.mapOffsetY;
            }

            if (window.coordinateManager && typeof window.coordinateManager.updateTransform === 'function') {
                window.coordinateManager.updateTransform(scale, this.gameScene.mapOffsetX, this.gameScene.mapOffsetY);
            }

            resolve();
        });
    }

    async updateAllGameElements() {
        await this.updatePlayer();
        await this.updateLandmarks();
        await this.updateDisasters();
        await this.updatePowerUps();
    }

    async updatePlayer() {
        return new Promise((resolve) => {
            if (!window.player || !this.gameScene) return resolve();
            const isPortrait = window.innerHeight > window.innerWidth;
            const portraitReduction = isPortrait ? 0.5 : 1.0;
            const playerScale = 0.15 * Math.max(0.6, this.gameScene.mapScale) * portraitReduction;
            window.player.setScale(playerScale);
            if (window.player.body) {
                const w = window.player.displayWidth * 0.8;
                const h = window.player.displayHeight * 0.8;
                window.player.body.setSize(w, h);
                window.player.body.setOffset((window.player.displayWidth - w) / 2, (window.player.displayHeight - h) / 2);
            }
            resolve();
        });
    }

    async updateLandmarks() {
        return new Promise((resolve) => {
            if (!window.landmarks || !window.landmarks.children || !this.gameScene) return resolve();
            window.landmarks.children.entries.forEach((lm) => {
                if (lm.landmarkData) {
                    const x = this.gameScene.mapOffsetX + (lm.landmarkData.x * this.gameScene.mapScale);
                    const y = this.gameScene.mapOffsetY + (lm.landmarkData.y * this.gameScene.mapScale);
                    lm.setPosition(x, y);
                    if (lm.body) {
                        const r = Math.max(20, 40 * this.gameScene.mapScale);
                        lm.body.setCircle(r, -r, -r);
                    }
                    if (lm.dotOverlay) {
                        lm.dotOverlay.x = x;
                        lm.dotOverlay.y = y;
                    }
                }
            });
            resolve();
        });
    }

    async updateDisasters() {
        return new Promise((resolve) => {
            if (!window.disasters || !window.disasters.children || !this.gameScene) return resolve();
            const isPortrait = window.innerHeight > window.innerWidth;
            const portraitReduction = isPortrait ? 0.7 : 1.0;
            window.disasters.children.entries.forEach((d) => {
                const mapX = (d.originalMapX !== undefined) ? d.originalMapX : d.originalX;
                const mapY = (d.originalMapY !== undefined) ? d.originalMapY : d.originalY;
                if (mapX !== undefined && mapY !== undefined) {
                    const x = this.gameScene.mapOffsetX + (mapX * this.gameScene.mapScale);
                    const y = this.gameScene.mapOffsetY + (mapY * this.gameScene.mapScale);
                    d.setPosition(x, y);
                    const s = 0.06 * Math.max(0.7, this.gameScene.mapScale) * portraitReduction;
                    d.setScale(s);
                    if (d.body) {
                        const w = d.displayWidth * 0.8;
                        const h = d.displayHeight * 0.8;
                        d.body.setSize(w, h);
                        d.body.setOffset((d.displayWidth - w) / 2, (d.displayHeight - h) / 2);
                    }
                }
            });
            resolve();
        });
    }

    async updatePowerUps() {
        return new Promise((resolve) => {
            if (!window.powerUps || !window.powerUps.children || !this.gameScene) return resolve();
            const isPortrait = window.innerHeight > window.innerWidth;
            const portraitReduction = isPortrait ? 0.6 : 1.0;
            window.powerUps.children.entries.forEach((p) => {
                const mapX = (p.originalMapX !== undefined) ? p.originalMapX : p.originalX;
                const mapY = (p.originalMapY !== undefined) ? p.originalMapY : p.originalY;
                if (mapX !== undefined && mapY !== undefined) {
                    const x = this.gameScene.mapOffsetX + (mapX * this.gameScene.mapScale);
                    const y = this.gameScene.mapOffsetY + (mapY * this.gameScene.mapScale);
                    p.setPosition(x, y);
                    const s = 0.08 * Math.max(0.7, this.gameScene.mapScale) * portraitReduction;
                    p.setScale(s);
                    if (p.body) {
                        const w = p.displayWidth;
                        const h = p.displayHeight;
                        p.body.setSize(w, h);
                        p.body.setOffset((p.displayWidth - w) / 2, (p.displayHeight - h) / 2);
                    }
                }
            });
            resolve();
        });
    }

    async refreshCollisionSystems() {
        return new Promise((resolve) => {
            if (!this.gameScene || !this.gameScene.physics || !this.gameScene.physics.world) return resolve();
            this.gameScene.physics.world.setBounds(
                this.gameScene.mapOffsetX,
                this.gameScene.mapOffsetY,
                this.gameScene.mapWidth,
                this.gameScene.mapHeight
            );

            // Clamp player inside new bounds (extra safety on mobile)
            if (window.player) {
                const left = this.gameScene.mapOffsetX;
                const right = this.gameScene.mapOffsetX + this.gameScene.mapWidth;
                const top = this.gameScene.mapOffsetY;
                const bottom = this.gameScene.mapOffsetY + this.gameScene.mapHeight;
                window.player.x = Phaser.Math.Clamp(window.player.x, left, right);
                window.player.y = Phaser.Math.Clamp(window.player.y, top, bottom);
            }
            resolve();
        });
    }

    async updateUIElements() {
        return new Promise((resolve) => {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.style.display = 'none';
                mobileControls.offsetHeight;
                mobileControls.style.display = 'block';
            }
            resolve();
        });
    }
}

// Export for global access
window.MobileHandler = MobileHandler;