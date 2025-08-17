/**
 * Mobile Orientation and Scaling Handler
 * Comprehensive solution for mobile orientation changes and coordinate management
 */

class MobileHandler {
    constructor() {
        this.isInitialized = false;
        this.currentOrientation = null;
        this.gameScene = null;
        this.originalMapDimensions = { width: 1200, height: 800 };
        this.coordinateCache = new Map();
        this.debounceTimer = null;
        this.isRecalculating = false;
        
        // Store original coordinates for all game elements
        this.originalCoordinates = {
            landmarks: [],
            disasters: [],
            powerUps: [],
            player: null
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Detect mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0);
        
        if (!this.isMobile) return;
        
        console.log('Initializing Mobile Handler');
        
        // Set up orientation handling with proper event listeners
        this.setupOrientationHandling();
        
        // Set up viewport meta tag for better mobile handling
        this.setupViewport();
        
        // Set up coordinate tracking
        this.setupCoordinateTracking();
        
        this.isInitialized = true;
    }
    
    setupViewport() {
        // Ensure proper viewport setup for mobile
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
    
    setupOrientationHandling() {
        // Multiple event listeners for comprehensive orientation detection
        
        // Screen Orientation API (modern browsers)
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.handleOrientationChange('screen.orientation');
            });
        }
        
        // Legacy orientationchange event
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange('orientationchange');
        });
        
        // Resize event as fallback
        window.addEventListener('resize', () => {
            this.handleOrientationChange('resize');
        });
        
        // Visual viewport API for better mobile support
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleOrientationChange('visualViewport');
            });
        }
    }
    
    setupCoordinateTracking() {
        // Create a mutation observer to track DOM changes
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.updateCoordinateCache();
                }
            });
        });
    }
    
    handleOrientationChange(source) {
        console.log(`Orientation change detected from: ${source}`);
        
        // Prevent multiple simultaneous recalculations
        if (this.isRecalculating) {
            console.log('Recalculation already in progress, skipping...');
            return;
        }
        
        // Clear existing debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Debounce orientation changes to prevent excessive recalculations
        this.debounceTimer = setTimeout(() => {
            this.performOrientationRecalculation();
        }, 300); // Increased delay for better stability
    }
    
    async performOrientationRecalculation() {
        if (!this.gameScene || this.isRecalculating) return;
        
        this.isRecalculating = true;
        console.log('Starting comprehensive mobile recalculation...');
        
        try {
            // Step 1: Update screen dimensions
            await this.updateScreenDimensions();
            
            // Step 2: Recalculate map scaling
            await this.recalculateMapScaling();
            
            // Step 3: Update all game element coordinates
            await this.updateAllGameElements();
            
            // Step 4: Refresh collision systems
            await this.refreshCollisionSystems();
            
            // Step 5: Update UI elements
            await this.updateUIElements();
            
            console.log('Mobile recalculation completed successfully');
            
        } catch (error) {
            console.error('Error during mobile recalculation:', error);
        } finally {
            this.isRecalculating = false;
        }
    }
    
    async updateScreenDimensions() {
        return new Promise((resolve) => {
            // Force layout recalculation
            document.body.offsetHeight;
            
            // Update game canvas size
            if (window.game && window.game.scale) {
                const newWidth = window.innerWidth;
                const newHeight = window.innerHeight;
                
                console.log(`Updating screen dimensions: ${newWidth}x${newHeight}`);
                window.game.scale.resize(newWidth, newHeight);
            }
            
            setTimeout(resolve, 50); // Allow time for resize to complete
        });
    }
    
    async recalculateMapScaling() {
        return new Promise((resolve) => {
            if (!this.gameScene) {
                resolve();
                return;
            }
            
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isLandscape = screenWidth > screenHeight;
            
            console.log(`Recalculating map scaling - ${isLandscape ? 'Landscape' : 'Portrait'}: ${screenWidth}x${screenHeight}`);
            
            // Calculate new scale based on orientation
            const scaleX = screenWidth / this.originalMapDimensions.width;
            const scaleY = screenHeight / this.originalMapDimensions.height;
            let scale = Math.min(scaleX, scaleY);
            
            // Apply mobile-specific scaling adjustments
            if (isLandscape) {
                scale = Math.min(scaleX * 0.95, scaleY * 0.90);
                scale = Math.max(0.5, Math.min(scale, 1.0));
            } else {
                scale = Math.max(0.4, Math.min(scale, 0.8));
            }
            
            // Update scene properties
            this.gameScene.mapScale = scale;
            
            const scaledMapWidth = this.originalMapDimensions.width * scale;
            const scaledMapHeight = this.originalMapDimensions.height * scale;
            
            this.gameScene.mapOffsetX = (screenWidth - scaledMapWidth) / 2;
            this.gameScene.mapOffsetY = (screenHeight - scaledMapHeight) / 2;
            this.gameScene.mapWidth = scaledMapWidth;
            this.gameScene.mapHeight = scaledMapHeight;
            
            console.log(`New scale: ${scale}, offset: (${this.gameScene.mapOffsetX}, ${this.gameScene.mapOffsetY})`);
            
            // Update map sprite (origin 0,0 as in create())
            if (this.gameScene.mapSprite) {
                this.gameScene.mapSprite.setOrigin(0, 0);
                this.gameScene.mapSprite.setScale(scale);
                this.gameScene.mapSprite.x = this.gameScene.mapOffsetX;
                this.gameScene.mapSprite.y = this.gameScene.mapOffsetY;
            }
            
            setTimeout(resolve, 50);
        });
    }
    
    async updateAllGameElements() {
        console.log('Updating all game elements...');
        
        // Update in sequence to prevent conflicts
        await this.updatePlayer();
        await this.updateLandmarks();
        await this.updateDisasters();
        await this.updatePowerUps();
    }
    
    async updatePlayer() {
        return new Promise((resolve) => {
            if (!window.player || !this.gameScene) {
                resolve();
                return;
            }
            
            const isPortrait = window.innerHeight > window.innerWidth;
            const portraitReduction = isPortrait ? 0.5 : 1.0;
            const playerScale = 0.15 * Math.max(0.6, this.gameScene.mapScale) * portraitReduction;
            
            window.player.setScale(playerScale);
            
            // Update collision box
            if (window.player.body) {
                const scaledWidth = window.player.width * playerScale;
                const scaledHeight = window.player.height * playerScale;
                
                window.player.body.setSize(scaledWidth * 0.8, scaledHeight * 0.8);
                window.player.body.setOffset(
                    (window.player.width - scaledWidth * 0.8) / 2,
                    (window.player.height - scaledHeight * 0.8) / 2
                );
            }
            
            console.log('Player updated');
            resolve();
        });
    }
    
    async updateLandmarks() {
        return new Promise((resolve) => {
            if (!window.landmarks || !window.landmarks.children || !this.gameScene) {
                resolve();
                return;
            }
            
            window.landmarks.children.entries.forEach((landmark) => {
                if (landmark.landmarkData) {
                    // Recalculate screen position from original coordinates
                    const screenX = this.gameScene.mapOffsetX + (landmark.landmarkData.x * this.gameScene.mapScale);
                    const screenY = this.gameScene.mapOffsetY + (landmark.landmarkData.y * this.gameScene.mapScale);
                    
                    landmark.setPosition(screenX, screenY);
                    
                    // Update collision radius
                    if (landmark.body) {
                        const landmarkRadius = Math.max(20, 40 * this.gameScene.mapScale);
                        landmark.body.setCircle(landmarkRadius);
                        landmark.body.setOffset(0, 0);
                    }
                    
                    // Update dot overlay
                    if (landmark.dotOverlay) {
                        landmark.dotOverlay.x = screenX;
                        landmark.dotOverlay.y = screenY;
                        
                        // Redraw with new scale
                        const color = landmark.landmarkData.saved ? 
                            (landmark.landmarkData.destroyed ? 0xFF0000 : 0x00FF00) : 0xFFFF00;
                        this.redrawDotOverlay(landmark.dotOverlay, color, this.gameScene.mapScale);
                    }
                }
            });
            
            console.log('Landmarks updated');
            resolve();
        });
    }
    
    async updateDisasters() {
        return new Promise((resolve) => {
            if (!window.disasters || !window.disasters.children || !this.gameScene) {
                resolve();
                return;
            }
            
            const isPortrait = window.innerHeight > window.innerWidth;
            const portraitReduction = isPortrait ? 0.7 : 1.0;
            
            window.disasters.children.entries.forEach((disaster) => {
                const baseX = disaster.originalMapX ?? disaster.originalX;
                const baseY = disaster.originalMapY ?? disaster.originalY;
                if (baseX !== undefined && baseY !== undefined) {
                    // Recalculate position
                    const screenX = this.gameScene.mapOffsetX + (baseX * this.gameScene.mapScale);
                    const screenY = this.gameScene.mapOffsetY + (baseY * this.gameScene.mapScale);
                    disaster.setPosition(screenX, screenY);
                    
                    // Update scale
                    const disasterScale = 0.06 * Math.max(0.7, this.gameScene.mapScale) * portraitReduction;
                    disaster.setScale(disasterScale);
                    
                    // Update collision box
                    if (disaster.body) {
                        const scaledWidth = disaster.width * disasterScale;
                        const scaledHeight = disaster.height * disasterScale;
                        disaster.body.setSize(scaledWidth * 0.8, scaledHeight * 0.8);
                        disaster.body.setOffset(
                            (disaster.width - scaledWidth * 0.8) / 2,
                            (disaster.height - scaledHeight * 0.8) / 2
                        );
                    }
                }
            });
            
            console.log('Disasters updated');
            resolve();
        });
    }

    addElementToTrack(element, type, data) {
        // Minimal tracking implementation to work with game.js calls
        if (!element || !this.gameScene) return;
        if (type === 'landmark') {
            element.originalMapX = data?.mapX;
            element.originalMapY = data?.mapY;
        } else if (type === 'dotOverlay') {
            element.originalMapX = data?.mapX;
            element.originalMapY = data?.mapY;
        } else if (type === 'disaster' || type === 'powerUp') {
            element.originalMapX = data?.mapX;
            element.originalMapY = data?.mapY;
        }
    }
    
    async updatePowerUps() {
        return new Promise((resolve) => {
            if (!window.powerUps || !window.powerUps.children || !this.gameScene) {
                resolve();
                return;
            }
            
            const isPortrait = window.innerHeight > window.innerWidth;
            const portraitReduction = isPortrait ? 0.6 : 1.0;
            
            window.powerUps.children.entries.forEach((powerUp) => {
                if (powerUp.originalX !== undefined && powerUp.originalY !== undefined) {
                    // Recalculate position
                    const screenX = this.gameScene.mapOffsetX + (powerUp.originalX * this.gameScene.mapScale);
                    const screenY = this.gameScene.mapOffsetY + (powerUp.originalY * this.gameScene.mapScale);
                    powerUp.setPosition(screenX, screenY);
                    
                    // Update scale
                    const powerUpScale = 0.08 * Math.max(0.7, this.gameScene.mapScale) * portraitReduction;
                    powerUp.setScale(powerUpScale);
                    
                    // Update collision box
                    if (powerUp.body) {
                        const scaledWidth = powerUp.width * powerUpScale;
                        const scaledHeight = powerUp.height * powerUpScale;
                        powerUp.body.setSize(scaledWidth, scaledHeight);
                        powerUp.body.setOffset(
                            (powerUp.width - scaledWidth) / 2,
                            (powerUp.height - scaledHeight) / 2
                        );
                    }
                }
            });
            
            console.log('Power-ups updated');
            resolve();
        });
    }
    
    async refreshCollisionSystems() {
        return new Promise((resolve) => {
            if (!this.gameScene || !this.gameScene.physics) {
                resolve();
                return;
            }
            
            // Update world bounds
            if (this.gameScene.physics.world) {
                this.gameScene.physics.world.setBounds(
                    this.gameScene.mapOffsetX,
                    this.gameScene.mapOffsetY,
                    this.gameScene.mapWidth,
                    this.gameScene.mapHeight
                );
            }
            
            console.log('Collision systems refreshed');
            resolve();
        });
    }
    
    async updateUIElements() {
        return new Promise((resolve) => {
            // Force UI elements to recalculate their positions
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                // Trigger reflow
                mobileControls.style.display = 'none';
                mobileControls.offsetHeight; // Force reflow
                mobileControls.style.display = 'block';
            }
            
            console.log('UI elements updated');
            resolve();
        });
    }
    
    redrawDotOverlay(graphics, color, scale) {
        if (!graphics) return;
        
        graphics.clear();
        const size = 4 * scale;
        
        graphics.fillStyle(color);
        graphics.lineStyle(2, 0x000000);
        graphics.fillCircle(0, 0, size);
        graphics.strokeCircle(0, 0, size);
    }
    
    setGameScene(scene) {
        this.gameScene = scene;
        console.log('Game scene set in mobile handler');
    }
    
    updateCoordinateCache() {
        // Cache current coordinates for quick access
        if (this.gameScene) {
            this.coordinateCache.set('mapScale', this.gameScene.mapScale);
            this.coordinateCache.set('mapOffsetX', this.gameScene.mapOffsetX);
            this.coordinateCache.set('mapOffsetY', this.gameScene.mapOffsetY);
        }
    }
    
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Remove event listeners
        if (screen.orientation) {
            screen.orientation.removeEventListener('change', this.handleOrientationChange);
        }
        
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        window.removeEventListener('resize', this.handleOrientationChange);
        
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', this.handleOrientationChange);
        }
        
        console.log('Mobile handler destroyed');
    }
}

// Export for use in main game
window.MobileHandler = MobileHandler;