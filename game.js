// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'gameCanvas',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    }
};

// Game Variables
let game;
let player;
let disasters = [];
let landmarks = [];
let gameStartTime;
let gameTimer = 60;
let score = 0;
let landmarksSavedCount = 0;
let isGameRunning = false;
let cursors;
let pointer;

// Mobile handling systems
let mobileHandler = null;
let coordinateManager = null;

// Power-up variables
let powerUps = [];
let isFrozen = false;
let freezeTimeLeft = 0;
let lastFreezeSpawn = 0;
let lastShieldSpawn = 0;

// Mobile controls variables
let mobileControls = {
    up: false,
    down: false,
    left: false,
    right: false,
    // Joystick state
    joystick: {
        active: false,
        startX: 0,
        startY: 0,
        dx: 0,
        dy: 0,
        normX: 0,
        normY: 0
    }
};

// Difficulty settings
let difficulty = 'medium'; // 'easy', 'medium', 'hard'
const difficultySettings = {
    easy: {
        disasterSpawnRate: 3000, // 3 seconds
        disasterSpeed: 0.6, // 60% speed
        powerUpFrequency: 0.7 // 30% faster power-ups
    },
    medium: {
        disasterSpawnRate: 2000, // 2 seconds  
        disasterSpeed: 1.0, // normal speed
        powerUpFrequency: 1.0 // normal power-ups
    },
    hard: {
        disasterSpawnRate: 1200, // 1.2 seconds
        disasterSpeed: 1.5, // 50% faster
        powerUpFrequency: 1.3 // 30% slower power-ups
    }
};

// Mikkeli landmarks data (using exact coordinates from image-coordinates.json)
const landmarkData = [
    { name: 'Mikkelin Tuomiokirkko', x: 139, y: 207, saved: false, destroyed: false }, // Point 1
    { name: 'Kivisakasti', x: 413, y: 132, saved: false, destroyed: false }, // Point 2
    { name: 'Stone Sacisty', x: 532, y: 115, saved: false, destroyed: false }, // Point 3
    { name: 'Jalkavääkimuseo', x: 679, y: 91, saved: false, destroyed: false }, // Point 4
    { name: 'Mikkeli Market Square', x: 506, y: 312, saved: false, destroyed: false }, // Point 5
    { name: 'Kenkävero Vickage Garden', x: 399, y: 445, saved: false, destroyed: false }, // Point 6
    { name: 'Mikkelin Tori', x: 272, y: 315, saved: false, destroyed: false }, // Point 7
    { name: 'Saimaa Island', x: 276, y: 412, saved: false, destroyed: false }, // Point 8
    { name: 'Mikkeli City', x: 161, y: 394, saved: false, destroyed: false }, // Point 9
    { name: 'Cultural Center', x: 629, y: 307, saved: false, destroyed: false }, // Point 10
    { name: 'South District', x: 624, y: 463, saved: false, destroyed: false }, // Point 11
    { name: 'East Quarter', x: 804, y: 253, saved: false, destroyed: false }, // Point 12
    { name: 'Harbor Area', x: 859, y: 378, saved: false, destroyed: false } // Point 13
];

// Consistent disaster scaling function used across spawn and orientation/fullscreen recalcs
function getDisasterScale(type, mapScale, isPortrait) {
    const portraitReduction = isPortrait ? 0.7 : 1.0;
    // Base multipliers tuned per asset intrinsic size
    const base = (type === 'storm') ? 0.15 : 0.2; // storm a bit smaller
    // Ensure mapScale has a gentle lower bound to avoid too tiny sprites
    const scaleComponent = Math.max(0.6, mapScale);
    return base * scaleComponent * portraitReduction;
}
// Expose globally so mobile-handler can use the same logic
window.getDisasterScale = getDisasterScale;

function preload() {
    // Load the Mikkeli map image with manually placed landmarks
    this.load.image('mikkeliMap', 'Map.png');
    
    // Load Dr Boogie image
    this.load.image('drBoogie', 'Dr');
    
    // Load meteor image
    this.load.image('meteor', 'Meteor');
    
    // Load storm image
    this.load.image('storm', 'Storm');
    
    // Load flood image
    this.load.image('flood', 'Flood-img');
    
    // Load power-up images
    this.load.image('freeze', 'Freeze');
    this.load.image('shield', 'Shield.56 PM');
    
    // Create simple colored rectangles as sprites since we don't have image assets
    this.add.graphics()
        .fillStyle(0x000000)
        .fillRect(0, 0, 1, 1)
        .generateTexture('pixel', 1, 1);

    // Note: Dr Boogie now uses the loaded image (Dr file)
    // Note: Meteor now uses the loaded image (Meteor file)

    // Create landmark sprite (more visible on the colorful map)
    const landmarkGraphics = this.add.graphics();
    // Gold star shape
    landmarkGraphics.fillStyle(0xFFD700);
    landmarkGraphics.beginPath();
    landmarkGraphics.moveTo(15, 0);
    landmarkGraphics.lineTo(18, 10);
    landmarkGraphics.lineTo(30, 10);
    landmarkGraphics.lineTo(21, 18);
    landmarkGraphics.lineTo(24, 30);
    landmarkGraphics.lineTo(15, 22);
    landmarkGraphics.lineTo(6, 30);
    landmarkGraphics.lineTo(9, 18);
    landmarkGraphics.lineTo(0, 10);
    landmarkGraphics.lineTo(12, 10);
    landmarkGraphics.closePath();
    landmarkGraphics.fillPath();
    // Add border for better visibility
    landmarkGraphics.lineStyle(3, 0x000000);
    landmarkGraphics.strokePath();
    landmarkGraphics.generateTexture('landmark', 30, 30);
    landmarkGraphics.destroy();

    // Create disaster sprites
    // Note: Meteor and Storm now use the loaded images
    
    // Blueberry rain
    const blueberryGraphics = this.add.graphics();
    blueberryGraphics.fillStyle(0x4B0082);
    for (let i = 0; i < 8; i++) {
        blueberryGraphics.fillCircle(Math.random() * 25, Math.random() * 25, 3);
    }
    blueberryGraphics.generateTexture('blueberry', 25, 25);
    blueberryGraphics.destroy();
}

function create() {
    // Initialize mobile handling systems
    if (!coordinateManager) {
        coordinateManager = new CoordinateManager();
        window.coordinateManager = coordinateManager;
    }
    if (!mobileHandler) {
        mobileHandler = new MobileHandler();
        window.mobileHandler = mobileHandler;
        mobileHandler.setGameScene(this);
    }
    
    // Create background using the actual Mikkeli map
    const mapSprite = this.add.image(0, 0, 'mikkeliMap');
    mapSprite.setOrigin(0, 0);
    this.mapSprite = mapSprite; // Store reference for mobile handler
    
    // Initialize coordinate manager with actual map dimensions
    coordinateManager.initialize(mapSprite.width, mapSprite.height);
    
    // Get actual screen dimensions
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;
    
    // Check if we're in fullscreen mode
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                       document.mozFullScreenElement || document.msFullscreenElement;
    
    // Calculate scale to ensure map fits properly in all orientations
    // No UI space reservation - UI will overlay on the map
    const scaleX = screenWidth / mapSprite.width;
    const scaleY = screenHeight / mapSprite.height;
    
    // Always use the smaller scale to ensure the map fits completely (no overflow)
    let scale = Math.min(scaleX, scaleY);
    
    // Detect orientation
    const mapIsPortrait = screenHeight > screenWidth;
    const isLandscape = screenWidth > screenHeight;
    
    // For mobile devices, ensure reasonable minimum and maximum scales
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    // Use coordinate manager for optimal scaling calculation if available, fallback to original logic
    if (coordinateManager && typeof coordinateManager.calculateOptimalScale === 'function') {
        scale = coordinateManager.calculateOptimalScale(screenWidth, screenHeight, isMobile);
    } else {
        // Fallback to original scaling logic
        console.warn('CoordinateManager not available, using fallback scaling');
        if (isMobile) {
            const isLandscape = screenWidth > screenHeight;
            const mapIsPortrait = mapSprite.height > mapSprite.width;
            
            if (isLandscape) {
                scale = Math.min(scaleX * 0.95, scaleY * 0.90);
                if (scale < 0.5) scale = 0.5;
                else if (scale > 1.0) scale = 1.0;
            } else if (mapIsPortrait) {
                if (scale < 0.4) scale = 0.4;
                else if (scale > 0.8) scale = 0.8;
            }
        } else {
            // Desktop - use nearly full space
            if (scale > 0.98) scale = 0.98;
        }
    }
    
    // Get centered offset
    let offsetX, offsetY;
    if (coordinateManager && typeof coordinateManager.calculateCenteredOffset === 'function') {
        const offset = coordinateManager.calculateCenteredOffset(scale, screenWidth, screenHeight);
        offsetX = offset.offsetX;
        offsetY = offset.offsetY;
    } else {
        // Fallback to manual calculation
        offsetX = (screenWidth - mapSprite.width * scale) / 2;
        offsetY = (screenHeight - mapSprite.height * scale) / 2;
    }
    
    mapSprite.setScale(scale);
    
    // Center the map properly using coordinate manager
    mapSprite.x = offsetX;
    mapSprite.y = offsetY;
    
    // Store map transform for coordinate conversion
    this.mapScale = scale;
    this.mapOffsetX = offsetX;
    this.mapOffsetY = offsetY;
    this.mapWidth = mapSprite.displayWidth;
    this.mapHeight = mapSprite.displayHeight;
    this.previousMapScale = scale;
    
    // Update coordinate manager with current transform if available
    if (coordinateManager && typeof coordinateManager.updateTransform === 'function') {
        coordinateManager.updateTransform(scale, offsetX, offsetY);
    }

    // Create player (Dr Boogie) - start in center of map using coordinate manager
    let centerX, centerY;
    if (coordinateManager && typeof coordinateManager.mapToScreen === 'function') {
        const centerPos = coordinateManager.mapToScreen(
            coordinateManager.baseMapWidth / 2, 
            coordinateManager.baseMapHeight / 2
        );
        centerX = centerPos.x;
        centerY = centerPos.y;
    } else {
        // Fallback to manual calculation
        centerX = this.mapOffsetX + (this.mapWidth / 2);
        centerY = this.mapOffsetY + (this.mapHeight / 2);
    }
    player = this.physics.add.sprite(centerX, centerY, 'drBoogie');
    
    // Set world bounds to map area instead of screen
    this.physics.world.setBounds(
        this.mapOffsetX, 
        this.mapOffsetY, 
        this.mapWidth, 
        this.mapHeight
    );
    
    player.setCollideWorldBounds(true);
    // Scale player proportionally to map scale, much smaller in portrait mode
    const isPortrait = this.scale.height > this.scale.width;
    const portraitReduction = isPortrait ? 0.5 : 1.0; // 50% smaller in portrait (was 30%)
    const playerScale = 0.15 * Math.max(0.6, this.mapScale) * portraitReduction;
    player.setScale(playerScale);
    
    // Use a centered circular body for consistent collisions across orientations
    const playerRadius = Math.min(player.displayWidth, player.displayHeight) * 0.45; // slightly inside sprite
    player.body.setCircle(playerRadius, (player.displayWidth - playerRadius * 2) / 2, (player.displayHeight - playerRadius * 2) / 2);
    
    // Create landmarks as invisible collision areas with dot overlays
    landmarks = this.physics.add.group();
    
    landmarkData.forEach((landmarkInfo, index) => {
        // Use coordinate manager for accurate map-to-screen conversion if available
        let screenX, screenY;
        if (coordinateManager && typeof coordinateManager.mapToScreen === 'function') {
            const screenPos = coordinateManager.mapToScreen(landmarkInfo.x, landmarkInfo.y);
            screenX = screenPos.x;
            screenY = screenPos.y;
        } else {
            // Fallback to manual calculation
            screenX = this.mapOffsetX + (landmarkInfo.x * this.mapScale);
            screenY = this.mapOffsetY + (landmarkInfo.y * this.mapScale);
        }
        
    // Create invisible circular collision area, centered
        const landmark = this.physics.add.sprite(screenX, screenY, null);
        landmark.setImmovable(true);
        landmark.landmarkData = landmarkInfo;
        landmark.setVisible(false); // Make it invisible
        // Scale collision area with map scale (base 40px radius)
    const landmarkRadius = Math.max(20, 40 * this.mapScale);
    // Center the circle at the sprite position; using -r offsets because sprite has no texture
    landmark.body.setCircle(landmarkRadius, -landmarkRadius, -landmarkRadius);
        landmark.scene = this; // Store scene reference
        landmarks.add(landmark);

        // Create colored dot overlay for visual feedback
        const dotOverlay = this.add.graphics();
        dotOverlay.x = screenX;
        dotOverlay.y = screenY;
        landmark.dotOverlay = dotOverlay;
        
        // Track landmark with mobile handler if available
        if (mobileHandler && typeof mobileHandler.addElementToTrack === 'function') {
            mobileHandler.addElementToTrack(landmark, 'landmark', {
                mapX: landmarkInfo.x,
                mapY: landmarkInfo.y
            });
            mobileHandler.addElementToTrack(dotOverlay, 'dotOverlay', {
                mapX: landmarkInfo.x,
                mapY: landmarkInfo.y
            });
        }
    });

    // Create disasters group
    disasters = this.physics.add.group();
    
    // Create power-ups group
    powerUps = this.physics.add.group();

    // Expose key objects for mobile handler and tests
    window.player = player;
    window.landmarks = landmarks;
    window.disasters = disasters;
    window.powerUps = powerUps;

    // Set up collisions
    this.physics.add.overlap(player, landmarks, saveLandmark, null, this);
    this.physics.add.overlap(landmarks, disasters, destroyLandmark, null, this);
    this.physics.add.overlap(player, disasters, blockDisaster, null, this);
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);

    // Input handling
    cursors = this.input.keyboard.createCursorKeys();
    
    // Touch/Mouse input (disabled on mobile to use arrow controls instead)
    this.input.on('pointerdown', (pointer) => {
        if (isGameRunning) {
            // Check if this is a mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           ('ontouchstart' in window) || 
                           (navigator.maxTouchPoints > 0);
            
            // Only use touch/click movement on desktop
            if (!isMobile) {
                const targetX = pointer.x;
                const targetY = pointer.y;
                
                // Move player towards touch/click position
                const currentScale = this.mapScale || 1;
                const moveSpeed = 200 * currentScale;
                this.physics.moveToObject(player, { x: targetX, y: targetY }, moveSpeed);
            }
        }
    });

    // Setup mobile controls
    setupMobileControls();

    // Start spawning disasters (rate depends on difficulty)
    this.time.addEvent({
        delay: difficultySettings[difficulty].disasterSpawnRate,
        callback: spawnDisaster,
        callbackScope: this,
        loop: true
    });

    // Game timer
    this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
    
    // Power-up spawning timers (frequency depends on difficulty)
    this.time.addEvent({
        delay: 8000 * difficultySettings[difficulty].powerUpFrequency,
        callback: spawnFreezePowerUp,
        callbackScope: this,
        loop: true
    });
    
    this.time.addEvent({
        delay: 6000 * difficultySettings[difficulty].powerUpFrequency,
        callback: spawnShieldPowerUp,
        callbackScope: this,
        loop: true
    });
    
    // Set up mobile orientation handler
    if (mobileHandler) {
        mobileHandler.setupOrientationHandling();
    }

    // Physics debug toggle (press 'D' to toggle) and global toggle method
    this.physics.world.createDebugGraphic();
    this.physics.world.drawDebug = false;
    if (this.physics.world.debugGraphic) {
        this.physics.world.debugGraphic.setVisible(false);
    }
    this.input.keyboard.on('keydown-D', () => {
        const w = this.physics.world;
        w.drawDebug = !w.drawDebug;
        if (w.debugGraphic) w.debugGraphic.setVisible(w.drawDebug);
    });
    // Also expose a toggle for external callers
    window.togglePhysicsDebug = () => {
        const w = game && game.scene && game.scene.scenes[0] && game.scene.scenes[0].physics.world;
        if (!w) return;
        w.drawDebug = !w.drawDebug;
        if (w.debugGraphic) w.debugGraphic.setVisible(w.drawDebug);
    };
}

function update() {
    if (!isGameRunning) return;
    
    // Handle freeze effect
    if (isFrozen && freezeTimeLeft > 0) {
        freezeTimeLeft -= 16; // Approximate delta time in milliseconds
        
        // Freeze all disasters (store their velocities if not already stored)
        disasters.children.entries.forEach(disaster => {
            if (disaster.active) {
                // For disasters created during freeze, originalVelocity is already set
                // For existing disasters, store their current velocity
                if (disaster.originalVelocityX === undefined && disaster.originalVelocityY === undefined) {
                    disaster.originalVelocityX = disaster.body.velocity.x;
                    disaster.originalVelocityY = disaster.body.velocity.y;
                }
                disaster.body.setVelocity(0, 0);
            }
        });
        
        if (freezeTimeLeft <= 0) {
            isFrozen = false;
            // Resume disaster movement with original velocities
            disasters.children.entries.forEach(disaster => {
                if (disaster.active && disaster.originalVelocityX !== undefined && disaster.originalVelocityY !== undefined) {
                    disaster.body.setVelocity(disaster.originalVelocityX, disaster.originalVelocityY);
                    // Clear stored velocities
                    disaster.originalVelocityX = undefined;
                    disaster.originalVelocityY = undefined;
                }
            });
        }
    }

    // Keyboard and mobile controls (scale movement speed with map scale to keep map-relative speed constant)
    const scale = this.mapScale || 1;
    const basePlayerSpeed = 200;
    const scaledSpeed = basePlayerSpeed * scale;

    // Input priority: joystick (mobile) > arrows (mobile) > keyboard
    let vx = 0, vy = 0;
    if (mobileControls.joystick.active) {
        vx = mobileControls.joystick.normX * scaledSpeed;
        vy = mobileControls.joystick.normY * scaledSpeed;
    } else {
        if (cursors.left.isDown || mobileControls.left) vx = -scaledSpeed;
        else if (cursors.right.isDown || mobileControls.right) vx = scaledSpeed;
        if (cursors.up.isDown || mobileControls.up) vy = -scaledSpeed;
        else if (cursors.down.isDown || mobileControls.down) vy = scaledSpeed;
    }
    player.setVelocity(vx, vy);

    // Update disasters
    disasters.children.entries.forEach(disaster => {
        if (disaster.active) {
            // Get map boundaries for cleanup
            const scene = disaster.scene;
            const mapLeft = scene.mapOffsetX - 100; // Cleanup margin
            const mapRight = scene.mapOffsetX + scene.mapWidth + 100;
            const mapTop = scene.mapOffsetY - 100;
            const mapBottom = scene.mapOffsetY + scene.mapHeight + 100;
            
            // Remove disasters that go too far from map area
            if (disaster.x < mapLeft || disaster.x > mapRight || 
                disaster.y < mapTop || disaster.y > mapBottom) {
                destroyCollisionOverlay(disaster);
                disaster.destroy();
                return;
            }

            // Soft clamp: if slightly outside the exact map rectangle, bring back in and flip velocity
            const exactLeft = scene.mapOffsetX;
            const exactRight = scene.mapOffsetX + scene.mapWidth;
            const exactTop = scene.mapOffsetY;
            const exactBottom = scene.mapOffsetY + scene.mapHeight;
            let bounced = false;
            if (disaster.x < exactLeft) {
                disaster.x = exactLeft;
                disaster.body.setVelocityX(Math.abs(disaster.body.velocity.x));
                bounced = true;
            } else if (disaster.x > exactRight) {
                disaster.x = exactRight;
                disaster.body.setVelocityX(-Math.abs(disaster.body.velocity.x));
                bounced = true;
            }
            if (disaster.y < exactTop) {
                disaster.y = exactTop;
                disaster.body.setVelocityY(Math.abs(disaster.body.velocity.y));
                bounced = true;
            } else if (disaster.y > exactBottom) {
                disaster.y = exactBottom;
                disaster.body.setVelocityY(-Math.abs(disaster.body.velocity.y));
                bounced = true;
            }
            if (bounced && (disaster.originalVelocityX !== undefined && disaster.originalVelocityY !== undefined)) {
                // Keep original velocity vectors roughly aligned after bounce
                disaster.originalVelocityX = disaster.body.velocity.x;
                disaster.originalVelocityY = disaster.body.velocity.y;
            }
        }
        updateCollisionOverlay(disaster);
    });
    
    // Update power-ups - remove if they go off screen or are too old
    powerUps.children.entries.forEach(powerUp => {
        if (powerUp.active) {
            powerUp.spawnTime = powerUp.spawnTime || Date.now();
            // Remove power-ups after 15 seconds
            if (Date.now() - powerUp.spawnTime > 15000) {
                destroyCollisionOverlay(powerUp);
                powerUp.destroy();
                return;
            }
        }
        updateCollisionOverlay(powerUp);
    });

    // Clamp player to exact map rectangle every frame to prevent leaving bounds on mobile
    if (player && this.mapOffsetX !== undefined) {
        const left = this.mapOffsetX;
        const right = this.mapOffsetX + this.mapWidth;
        const top = this.mapOffsetY;
        const bottom = this.mapOffsetY + this.mapHeight;
        player.x = Phaser.Math.Clamp(player.x, left, right);
        player.y = Phaser.Math.Clamp(player.y, top, bottom);
    }
}

// Function to draw a colored dot overlay at landmark coordinates
function drawDotOverlay(graphics, color, scale) {
    graphics.clear();
    const size = 4 * scale; // Smaller dot radius (reduced from 6)
    
    graphics.fillStyle(color);
    graphics.lineStyle(2, 0x000000); // Black border
    
    // Draw circle dot
    graphics.fillCircle(0, 0, size);
    graphics.strokeCircle(0, 0, size);
}

// Lightweight visual aid: small collision radius overlay for disasters/power-ups
function drawCollisionOverlay(graphics, radius, color = 0xffffff, alpha = 0.35, thickness = 2) {
    if (!graphics) return;
    graphics.clear();
    graphics.lineStyle(thickness, color, alpha);
    graphics.strokeCircle(0, 0, radius);
}

function getCollisionOverlayRadius(sprite) {
    if (!sprite) return 0;
    const bw = (sprite.body && sprite.body.width) ? sprite.body.width : sprite.displayWidth || 0;
    const bh = (sprite.body && sprite.body.height) ? sprite.body.height : sprite.displayHeight || 0;
    const baseR = Math.min(bw, bh) / 2;
    return Math.max(4, baseR * 0.9);
}

function ensureCollisionOverlay(sprite, color) {
    if (!sprite || !sprite.scene) return;
    if (!sprite.collisionOverlay || !sprite.collisionOverlay.scene) {
        const g = sprite.scene.add.graphics();
        g.setDepth((sprite.depth || 0) + 1);
        sprite.collisionOverlay = g;
        if (!sprite._collisionOverlayDestroyHook && typeof sprite.on === 'function') {
            sprite.on('destroy', () => {
                destroyCollisionOverlay(sprite);
            });
            sprite._collisionOverlayDestroyHook = true;
        }
    }
    sprite.collisionOverlayColor = color || sprite.collisionOverlayColor || 0xffffff;
    updateCollisionOverlay(sprite);
}

function updateCollisionOverlay(sprite) {
    if (!sprite || !sprite.collisionOverlay) return;
    const g = sprite.collisionOverlay;
    g.x = sprite.x;
    g.y = sprite.y;
    const radius = getCollisionOverlayRadius(sprite);
    drawCollisionOverlay(g, radius, sprite.collisionOverlayColor || 0xffffff);
}

function destroyCollisionOverlay(sprite) {
    if (sprite && sprite.collisionOverlay) {
        try { sprite.collisionOverlay.destroy(); } catch (e) { /* noop */ }
        sprite.collisionOverlay = null;
    }
}

function saveLandmark(player, landmark) {
    if (landmark.landmarkData.saved) return;

    landmark.landmarkData.saved = true;
    landmark.landmarkData.destroyed = false; // Reset destroyed state when saved
    landmarksSavedCount++;
    
    // Add a green dot on the map at the landmark coordinates
    drawDotOverlay(landmark.dotOverlay, 0x00FF00, player.scene.mapScale);
    
    // Updated scoring: Landmark saved = +50 points
    let points = 50;
    score += points;
    
    // Update UI
    updateUI();
    
    // Visual feedback
    const scene = landmark.scene;
    const textScale = Math.max(0.6, scene.mapScale);
    
    // Detect if mobile for enhanced text visibility
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    const textStyle = {
        fontSize: `${20 * textScale}px`,
        fill: '#00FF00',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
    };
    
    // Add stronger outline for mobile visibility
    if (isMobile) {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 4;
        textStyle.fontWeight = '900'; // Extra bold for mobile
    } else {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 2;
    }
    
    const text = scene.add.text(landmark.x, landmark.y - 30 * textScale, 'SAVED! +50', textStyle);
    
    scene.tweens.add({
        targets: text,
        y: text.y - 50 * textScale,
        alpha: 0,
        duration: 1000,
        onComplete: () => text.destroy()
    });
}

function blockDisaster(player, disaster) {
    if (!player || !player.active || !disaster || !disaster.active) return;
    // Player collides with disaster - this counts as "blocking disaster" = +10 points
    score += 10;
    
    // Visual feedback for blocked disaster
    const scene = player.scene;
    const textScale = Math.max(0.6, scene.mapScale);
    
    // Detect if mobile for enhanced text visibility
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    const textStyle = {
        fontSize: `${16 * textScale}px`,
        fill: '#00FF00',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
    };
    
    // Add stronger outline for mobile visibility
    if (isMobile) {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 4;
        textStyle.fontWeight = '900'; // Extra bold for mobile
    } else {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 2;
    }
    
    const text = scene.add.text(player.x, player.y - 30 * textScale, 'BLOCKED! +10', textStyle);
    
    scene.tweens.add({
        targets: text,
        y: text.y - 50 * textScale,
        alpha: 0,
        duration: 1500,
        onComplete: () => text.destroy()
    });
    
    // Clean visual overlay then destroy
    destroyCollisionOverlay(disaster);
    disaster.destroy();
    updateUI();
}

function destroyLandmark(landmark, disaster) {
    // Check if landmark is already destroyed to prevent multiple penalties
    if (landmark.landmarkData.destroyed) {
        destroyCollisionOverlay(disaster);
        disaster.destroy();
        return;
    }

    // Check if landmark has a shield
    if (landmark.hasShield) {
        // Shield absorbs the hit
        landmark.hasShield = false;
        
        // Visual feedback for shield absorption
        const scene = landmark.scene;
        const textScale = Math.max(0.6, scene.mapScale);
        
        // Detect if mobile for enhanced text visibility
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         ('ontouchstart' in window) || 
                         (navigator.maxTouchPoints > 0);
        
        const textStyle = {
            fontSize: `${14 * textScale}px`,
            fill: '#FFD700',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        };
        
        // Add stronger outline for mobile visibility
        if (isMobile) {
            textStyle.stroke = '#000000';
            textStyle.strokeThickness = 4;
            textStyle.fontWeight = '900'; // Extra bold for mobile
        } else {
            textStyle.stroke = '#000000';
            textStyle.strokeThickness = 2;
        }
        
        const text = scene.add.text(landmark.x, landmark.y - 30 * textScale, 'SHIELD BLOCKED!', textStyle);
        
        scene.tweens.add({
            targets: text,
            y: text.y - 50 * textScale,
            alpha: 0,
            duration: 1500,
            onComplete: () => text.destroy()
        });
        
        destroyCollisionOverlay(disaster);
        disaster.destroy();
        return;
    }

    // Mark landmark as destroyed
    landmark.landmarkData.destroyed = true;

    // If landmark was not saved, apply penalty
    if (!landmark.landmarkData.saved) {
        score -= 20;
    }
    
    // Always mark as not saved when destroyed
    landmark.landmarkData.saved = false;
    
    // Add a red dot on the map at the landmark coordinates
    drawDotOverlay(landmark.dotOverlay, 0xFF0000, disaster.scene.mapScale);
    
    // Visual feedback for failed protection
    const scene = landmark.scene;
    const textScale = Math.max(0.6, scene.mapScale);
    
    // Detect if mobile for enhanced text visibility
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    const textStyle = {
        fontSize: `${16 * textScale}px`,
        fill: '#FF0000',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif'
    };
    
    // Add stronger outline for mobile visibility
    if (isMobile) {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 4;
        textStyle.fontWeight = '900'; // Extra bold for mobile
    } else {
        textStyle.stroke = '#000000';
        textStyle.strokeThickness = 2;
    }
    
    const text = scene.add.text(landmark.x, landmark.y - 30 * textScale, 'DESTROYED! -20', textStyle);
    
    scene.tweens.add({
        targets: text,
        y: text.y - 50 * textScale,
        alpha: 0,
        duration: 1500,
        onComplete: () => text.destroy()
    });
    
    destroyCollisionOverlay(disaster);
    disaster.destroy();
    updateUI();
}

function updateTimer() {
    if (!isGameRunning) return;
    
    gameTimer--;
    updateUI();
    
    if (gameTimer <= 0) {
        endGame();
    }
}

function updateUI() {
    document.getElementById('timeLeft').textContent = gameTimer;
    document.getElementById('currentScore').textContent = score;
}

function startGame() {
    isGameRunning = true;
    gameStartTime = Date.now();
    gameTimer = 60;
    score = 0;
    landmarksSavedCount = 0;
    
    // Reset power-up variables
    isFrozen = false;
    freezeTimeLeft = 0;
    lastFreezeSpawn = 0;
    lastShieldSpawn = 0;
    
    // Reset mobile controls
    mobileControls.up = false;
    mobileControls.down = false;
    mobileControls.left = false;
    mobileControls.right = false;
    
    // Reset landmarks
    landmarkData.forEach(landmark => {
        landmark.saved = false;
        landmark.destroyed = false;
    });
    
    if (game) {
        // Clear dot overlays and reset shields
        landmarks.children.entries.forEach(landmark => {
            if (landmark.dotOverlay) {
                landmark.dotOverlay.clear();
            }
            landmark.hasShield = false; // Reset shields
        });
        
        // Clear existing disasters
        disasters.children.entries.forEach(disaster => {
            destroyCollisionOverlay(disaster);
            disaster.destroy();
        });
        
        // Clear existing power-ups
        powerUps.children.entries.forEach(powerUp => {
            destroyCollisionOverlay(powerUp);
            powerUp.destroy();
        });
    }
    
    updateUI();
}

// Power-up Functions
function spawnFreezePowerUp() {
    if (!isGameRunning) return;
    
    // Don't spawn too frequently
    if (Date.now() - lastFreezeSpawn < 10000) return; // 10 second cooldown
    lastFreezeSpawn = Date.now();
    
    // Get random position within map boundaries using coordinate manager
    const mapMargin = 50;
    const mapX = Phaser.Math.Between(mapMargin, coordinateManager.baseMapWidth - mapMargin);
    const mapY = Phaser.Math.Between(mapMargin, coordinateManager.baseMapHeight - mapMargin);
    
    // Convert to screen coordinates
    const freezePowerUp = powerUps.create(mapX, mapY, 'freeze');
    
    // Store original map coordinates for coordinate manager tracking
    freezePowerUp.originalMapX = mapX;
    freezePowerUp.originalMapY = mapY;
    
    // Scale power-up proportionally to map scale, smaller in portrait mode
    const scene = game.scene.getScene('default');
    const isPortrait = scene.scale.height > scene.scale.width;
    const portraitReduction = isPortrait ? 0.7 : 1.0; // 30% smaller in portrait
    const powerUpScale = 0.12 * Math.max(0.6, scene.mapScale) * portraitReduction;
    freezePowerUp.setScale(powerUpScale);
    
    // Track power-up with mobile handler
    mobileHandler.addElementToTrack(freezePowerUp, 'powerUp', {
        mapX: mapX,
        mapY: mapY
    });
    
    // Set collision body to centered circle based on display size (post-scale)
    if (freezePowerUp.body) {
        const r = Math.min(freezePowerUp.displayWidth, freezePowerUp.displayHeight) * 0.5;
        freezePowerUp.body.setCircle(r, (freezePowerUp.displayWidth - r * 2) / 2, (freezePowerUp.displayHeight - r * 2) / 2);
    }

    // Visual collision radius overlay (cyan for freeze)
    freezePowerUp.collisionOverlayColor = 0x00ffff;
    ensureCollisionOverlay(freezePowerUp, freezePowerUp.collisionOverlayColor);
    
    freezePowerUp.powerType = 'freeze';
    freezePowerUp.spawnTime = Date.now();
    
    // Add gentle floating animation
    game.scene.getScene('default').tweens.add({
        targets: freezePowerUp,
        y: freezePowerUp.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
}

function spawnShieldPowerUp() {
    if (!isGameRunning) return;
    
    // Don't spawn too frequently
    if (Date.now() - lastShieldSpawn < 8000) return; // 8 second cooldown
    lastShieldSpawn = Date.now();
    
    // Find saved landmarks that DON'T already have shields
    const unshieldedLandmarks = landmarks.children.entries.filter(landmark => 
        landmark.landmarkData && 
        landmark.landmarkData.saved && 
        !landmark.landmarkData.destroyed &&
        !landmark.hasShield // Only landmarks without shields
    );
    
    if (unshieldedLandmarks.length === 0) return;
    
    const targetLandmark = Phaser.Utils.Array.GetRandom(unshieldedLandmarks);
    
    // Calculate shield position relative to landmark's map coordinates
    const landmarkMapX = targetLandmark.originalMapX || targetLandmark.landmarkData.x;
    const landmarkMapY = targetLandmark.originalMapY || targetLandmark.landmarkData.y;
    const offsetMapX = Phaser.Math.Between(-50, 50) / game.scene.getScene('default').mapScale;
    const offsetMapY = Phaser.Math.Between(-50, 50) / game.scene.getScene('default').mapScale;
    
    const shieldMapX = landmarkMapX + offsetMapX;
    const shieldMapY = landmarkMapY + offsetMapY;
    
    // Convert to screen coordinates
    const shieldPowerUp = powerUps.create(shieldMapX, shieldMapY, 'shield');
    
    // Store original map coordinates for coordinate manager tracking
    shieldPowerUp.originalMapX = shieldMapX;
    shieldPowerUp.originalMapY = shieldMapY;
    
    // Scale shield power-up proportionally to map scale, smaller in portrait mode
    const shieldScene = game.scene.getScene('default');
    const isPortraitShield = shieldScene.scale.height > shieldScene.scale.width;
    const portraitReductionShield = isPortraitShield ? 0.7 : 1.0; // 30% smaller in portrait
    const shieldScale = 0.1 * Math.max(0.6, shieldScene.mapScale) * portraitReductionShield;
    shieldPowerUp.setScale(shieldScale);
    
    // Track shield power-up with mobile handler
    mobileHandler.addElementToTrack(shieldPowerUp, 'powerUp', {
        mapX: shieldMapX,
        mapY: shieldMapY
    });
    
    // Set collision body to centered circle based on scaled shield power-up size
    if (shieldPowerUp.body) {
        const r = Math.min(shieldPowerUp.displayWidth, shieldPowerUp.displayHeight) * 0.5;
        shieldPowerUp.body.setCircle(r, (shieldPowerUp.displayWidth - r * 2) / 2, (shieldPowerUp.displayHeight - r * 2) / 2);
    }

    // Visual collision radius overlay (gold for shield)
    shieldPowerUp.collisionOverlayColor = 0xffd700;
    ensureCollisionOverlay(shieldPowerUp, shieldPowerUp.collisionOverlayColor);
    
    shieldPowerUp.powerType = 'shield';
    shieldPowerUp.targetLandmark = targetLandmark;
    shieldPowerUp.spawnTime = Date.now();
    
    // Add gentle rotation
    game.scene.getScene('default').tweens.add({
        targets: shieldPowerUp,
        rotation: Math.PI * 2,
        duration: 3000,
        repeat: -1,
        ease: 'Linear'
    });
}

function collectPowerUp(player, powerUp) {
    if (!player || !player.active || !powerUp || !powerUp.active) return;
    if (powerUp.powerType === 'freeze') {
        // Activate freeze effect
        isFrozen = true;
        freezeTimeLeft = 5000; // 5 seconds
        
        // Visual feedback
        const scene = player.scene;
        const textScale = Math.max(0.6, scene.mapScale);
        
        // Detect if mobile for enhanced text visibility
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         ('ontouchstart' in window) || 
                         (navigator.maxTouchPoints > 0);
        
        const textStyle = {
            fontSize: `${18 * textScale}px`,
            fill: '#00FFFF',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        };
        
        // Add stronger outline for mobile visibility
        if (isMobile) {
            textStyle.stroke = '#000000';
            textStyle.strokeThickness = 4;
            textStyle.fontWeight = '900'; // Extra bold for mobile
        } else {
            textStyle.stroke = '#000000';
            textStyle.strokeThickness = 2;
        }
        
        const text = scene.add.text(powerUp.x, powerUp.y - 30 * textScale, 'TIME FREEZE!', textStyle);
        
        scene.tweens.add({
            targets: text,
            y: text.y - 50 * textScale,
            alpha: 0,
            duration: 2000,
            onComplete: () => text.destroy()
        });
        
    } else if (powerUp.powerType === 'shield') {
        // Add shield to target landmark
        if (powerUp.targetLandmark && powerUp.targetLandmark.active) {
            powerUp.targetLandmark.hasShield = true;
            
            // Visual feedback
            const scene = player.scene;
            const textScale = Math.max(0.6, scene.mapScale);
            
            // Detect if mobile for enhanced text visibility
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             ('ontouchstart' in window) || 
                             (navigator.maxTouchPoints > 0);
            
            const textStyle = {
                fontSize: `${16 * textScale}px`,
                fill: '#FFD700',
                fontStyle: 'bold',
                fontFamily: 'Arial, sans-serif'
            };
            
            // Add stronger outline for mobile visibility
            if (isMobile) {
                textStyle.stroke = '#000000';
                textStyle.strokeThickness = 4;
                textStyle.fontWeight = '900'; // Extra bold for mobile
            } else {
                textStyle.stroke = '#000000';
                textStyle.strokeThickness = 2;
            }
            
            const text = scene.add.text(powerUp.x, powerUp.y - 30 * textScale, 'SHIELD ACTIVE!', textStyle);
            
            scene.tweens.add({
                targets: text,
                y: text.y - 50 * textScale,
                alpha: 0,
                duration: 2000,
                onComplete: () => text.destroy()
            });
        }
    }
    
    destroyCollisionOverlay(powerUp);
    powerUp.destroy();
}

// Fullscreen functionality
function setupFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (fullscreenBtn) {
        // Only show fullscreen button on mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         ('ontouchstart' in window) || 
                         (navigator.maxTouchPoints > 0);
        
        if (isMobile) {
            // Show fullscreen button for mobile devices
            fullscreenBtn.style.display = 'block';
        } else {
            // Hide fullscreen button for desktop
            fullscreenBtn.style.display = 'none';
        }
        
        fullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFullscreen();
        });
        
        // Listen for fullscreen changes to update button appearance
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
        document.addEventListener('mozfullscreenchange', updateFullscreenButton);
        document.addEventListener('MSFullscreenChange', updateFullscreenButton);
        
        console.log('Fullscreen setup complete');
       } else {
        console.error('Fullscreen button not found');
    }
}

function toggleFullscreen() {
    try {
        const gameContainer = document.getElementById('gameContainer');
        console.log('Toggle fullscreen called');
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            // Enter fullscreen
            console.log('Entering fullscreen...');
            
            let fullscreenPromise;
            if (gameContainer.requestFullscreen) {
                fullscreenPromise = gameContainer.requestFullscreen();
            } else if (gameContainer.webkitRequestFullscreen) {
                fullscreenPromise = gameContainer.webkitRequestFullscreen();
            } else if (gameContainer.mozRequestFullScreen) {
                fullscreenPromise = gameContainer.mozRequestFullScreen();
            } else if (gameContainer.msRequestFullscreen) {
                fullscreenPromise = gameContainer.msRequestFullscreen();
            } else {
                console.error('Fullscreen not supported');
                return;
            }
            
            // Handle promise if it exists
            if (fullscreenPromise && fullscreenPromise.then) {
                fullscreenPromise.then(() => {
                    console.log('Fullscreen entered successfully');
                    // Don't lock orientation - let user choose
                    updateFullscreenButton();
                }).catch((err) => {
                    console.error('Fullscreen failed:', err);
                });
            } else {
                updateFullscreenButton();
            }
        } else {
            // Exit fullscreen
            console.log('Exiting fullscreen...');
            
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            // Update button after exiting
            setTimeout(() => {
                updateFullscreenButton();
            }, 100);
        }
    } catch (error) {
        console.error('Fullscreen error:', error);
    }
}

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                           document.mozFullScreenElement || document.msFullscreenElement;
        
        fullscreenBtn.textContent = isFullscreen ? '⛉' : '⛶';
        fullscreenBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
    }
    
    // Resize game when fullscreen changes and recalculate map scale
    setTimeout(() => {
        if (game && game.scene && game.scene.scenes[0]) {
            const gameScene = game.scene.scenes[0];
            game.scale.resize(window.innerWidth, window.innerHeight);
            
            // Force recalculation of map scale for fullscreen
            if (gameScene.scene.isActive()) {
                recalculateMapForFullscreen(gameScene);
            }
        }
    }, 150);
}

function recalculateMapForFullscreen(scene) {
    try {
        console.log('Recalculating map for fullscreen/orientation change');
        
        // Get the current fullscreen state
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || 
                           document.mozFullScreenElement || document.msFullscreenElement;
        
        // Get current screen dimensions
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        console.log(`Screen dimensions: ${screenWidth}x${screenHeight}, Fullscreen: ${isFullscreen}`);
        
    // Use actual map dimensions from the loaded sprite/coordinate manager
    const mapWidth = (scene.mapSprite && scene.mapSprite.width) || (window.coordinateManager && window.coordinateManager.baseMapWidth) || 1200;
    const mapHeight = (scene.mapSprite && scene.mapSprite.height) || (window.coordinateManager && window.coordinateManager.baseMapHeight) || 800;
        
        let scaleX = screenWidth / mapWidth;
        let scaleY = screenHeight / mapHeight;
        let scale;
        
        if (isFullscreen) {
            // In fullscreen, use maximum possible scale while maintaining aspect ratio
            scale = Math.min(scaleX, scaleY);
            
            // Detect if mobile for different fullscreen scaling
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           ('ontouchstart' in window) || 
                           (navigator.maxTouchPoints > 0);
            
            if (isMobile) {
                // Mobile fullscreen: use 98% of available space
                scale = scale * 0.98;
            } else {
                // Desktop fullscreen: use 100% (maximum scale)
                scale = scale * 1.0;
            }
            
            console.log(`Fullscreen scale calculated: ${scale} for ${isMobile ? 'mobile' : 'desktop'}`);
        } else {
            // Normal scaling logic
            const isLandscape = screenWidth > screenHeight;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           ('ontouchstart' in window) || 
                           (navigator.maxTouchPoints > 0);
            
            scale = Math.min(scaleX, scaleY);
            
            if (isMobile) {
                if (isLandscape) {
                    scale = Math.min(scaleX * 0.95, scaleY * 0.90);
                    if (scale < 0.5) scale = 0.5;
                    else if (scale > 1.0) scale = 1.0;
                } else {
                    if (scale < 0.4) scale = 0.4;
                    else if (scale > 0.8) scale = 0.8;
                }
            } else {
                // Desktop - use original full space settings
                scale = Math.min(scaleX, scaleY);
                if (scale > 0.98) {
                    scale = 0.98; // Use 98% of screen space like originally
                }
            }
        }
        
    // Update scene's map scale
    scene.mapScale = scale;
        
        // Recalculate map position (center it)
        const scaledMapWidth = mapWidth * scale;
        const scaledMapHeight = mapHeight * scale;
        
        scene.mapOffsetX = (screenWidth - scaledMapWidth) / 2;
        scene.mapOffsetY = (screenHeight - scaledMapHeight) / 2;

        // Sync coordinate manager with new transform
        if (window.coordinateManager && typeof window.coordinateManager.updateTransform === 'function') {
            window.coordinateManager.updateTransform(scene.mapScale, scene.mapOffsetX, scene.mapOffsetY);
        }
        
        console.log(`New map scale: ${scale}, offset: (${scene.mapOffsetX}, ${scene.mapOffsetY})`);
        
        // Update map sprite if it exists (origin 0,0 as in create)
        if (scene.mapSprite) {
            scene.mapSprite.setOrigin(0, 0);
            scene.mapSprite.setScale(scale);
            scene.mapSprite.x = scene.mapOffsetX;
            scene.mapSprite.y = scene.mapOffsetY;
        }

        // Update physics world bounds to the new map rectangle
        if (scene.physics && scene.physics.world) {
            scene.physics.world.setBounds(
                scene.mapOffsetX,
                scene.mapOffsetY,
                scaledMapWidth,
                scaledMapHeight
            );
        }
        // Keep scene map dimensions in sync for per-frame clamping
        scene.mapWidth = scaledMapWidth;
        scene.mapHeight = scaledMapHeight;
        
    // Update player scale and position if exists
        if (player) {
            const isPortrait = screenHeight > screenWidth;
            const portraitReduction = isPortrait ? 0.5 : 1.0;
            const playerScale = 0.15 * Math.max(0.6, scale) * portraitReduction;
            player.setScale(playerScale);
            
            // Update player collision body to centered circle
            if (player.body) {
                const r = Math.min(player.displayWidth, player.displayHeight) * 0.45;
                player.body.setCircle(r, (player.displayWidth - r * 2) / 2, (player.displayHeight - r * 2) / 2);
                if (typeof player.body.updateFromGameObject === 'function') {
                    player.body.updateFromGameObject();
                }
            }

            // Clamp player inside new map bounds
            const left = scene.mapOffsetX;
            const right = scene.mapOffsetX + scaledMapWidth;
            const top = scene.mapOffsetY;
            const bottom = scene.mapOffsetY + scaledMapHeight;
            player.x = Phaser.Math.Clamp(player.x, left, right);
            player.y = Phaser.Math.Clamp(player.y, top, bottom);
        }
        
        // Update disasters positions and scales
        if (disasters && disasters.children && disasters.children.entries) {
            disasters.children.entries.forEach((disaster) => {
                if (disaster.originalMapX !== undefined && disaster.originalMapY !== undefined) {
                    const screenX = scene.mapOffsetX + (disaster.originalMapX * scale);
                    const screenY = scene.mapOffsetY + (disaster.originalMapY * scale);
                    disaster.setPosition(screenX, screenY);
                    
                    const isPortrait = screenHeight > screenWidth;
                    const disasterScale = getDisasterScale(disaster.disasterType || 'storm', scale, isPortrait);
                    disaster.setScale(disasterScale);
                    
                    // Update collision body for disasters to centered circle
                    if (disaster.body) {
                        const r = Math.min(disaster.displayWidth, disaster.displayHeight) * 0.4;
                        disaster.body.setCircle(r, (disaster.displayWidth - r * 2) / 2, (disaster.displayHeight - r * 2) / 2);
                        if (typeof disaster.body.updateFromGameObject === 'function') {
                            disaster.body.updateFromGameObject();
                        }

                        // Also scale existing disaster velocity to keep visual speed consistent with scale
                        const prevScale = scene.previousMapScale || scale;
                        if (prevScale !== 0) {
                            const ratio = scale / prevScale;
                            if (!isFrozen) {
                                disaster.body.setVelocity(disaster.body.velocity.x * ratio, disaster.body.velocity.y * ratio);
                            }
                            // Keep original velocities in sync for correct freeze/unfreeze behavior
                            if (disaster.originalVelocityX !== undefined && disaster.originalVelocityY !== undefined) {
                                disaster.originalVelocityX *= ratio;
                                disaster.originalVelocityY *= ratio;
                            }
                        }
                    }

                    // Keep overlay in sync
                    updateCollisionOverlay(disaster);
                }
            });
        }
        
        // Update power-ups positions and scales
        if (powerUps && powerUps.children && powerUps.children.entries) {
            powerUps.children.entries.forEach((powerUp) => {
                if (powerUp.originalMapX !== undefined && powerUp.originalMapY !== undefined) {
                    const screenX = scene.mapOffsetX + (powerUp.originalMapX * scale);
                    const screenY = scene.mapOffsetY + (powerUp.originalMapY * scale);
                    powerUp.setPosition(screenX, screenY);
                    
                    const isPortrait = screenHeight > screenWidth;
                    const portraitReduction = isPortrait ? 0.6 : 1.0;
                    const powerUpScale = 0.08 * Math.max(0.7, scale) * portraitReduction;
                    powerUp.setScale(powerUpScale);
                    
                    // Update collision body for power-ups to centered circle
                    if (powerUp.body) {
                        const r = Math.min(powerUp.displayWidth, powerUp.displayHeight) * 0.5;
                        powerUp.body.setCircle(r, (powerUp.displayWidth - r * 2) / 2, (powerUp.displayHeight - r * 2) / 2);
                        if (typeof powerUp.body.updateFromGameObject === 'function') {
                            powerUp.body.updateFromGameObject();
                        }
                    }

                    // Keep overlay in sync
                    updateCollisionOverlay(powerUp);
                }
            });
        }
        
    // Record the last scale to compute ratios on the next change
    scene.previousMapScale = scale;

    console.log('Map recalculation complete');
        
    } catch (error) {
        console.error('Error recalculating map for fullscreen:', error);
    }
}

function endGame() {
    isGameRunning = false;
    
    // Calculate final score and message
    let finalScore = score;
    
    // Perfect game bonus: +100 points for saving all landmarks
    if (landmarksSavedCount === landmarkData.length) {
        finalScore += 100;
    }
    
    const teamName = document.getElementById('teamName').value || 'Anonymous Team';
    
    let resultMessage = '';
    if (landmarksSavedCount === landmarkData.length) {
        resultMessage = 'Perfect! You saved all of Mikkeli! +100 bonus!';
    } else if (landmarksSavedCount >= landmarkData.length * 0.8) {
        resultMessage = 'Excellent work! Mikkeli is mostly safe!';
    } else if (landmarksSavedCount >= landmarkData.length * 0.5) {
        resultMessage = 'Good job! You saved half of Mikkeli!';
    } else if (landmarksSavedCount > 0) {
        resultMessage = 'Some landmarks saved, but Mikkeli needs more help!';
    } else {
        resultMessage = 'Disaster! All landmarks were destroyed!';
    }
    
    // Update end screen
    document.getElementById('finalTeamName').textContent = teamName;
    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('landmarksSaved').textContent = landmarksSavedCount;
    document.getElementById('resultMessage').textContent = resultMessage;
    
    // Save score to leaderboard
    saveScore(teamName, finalScore, landmarksSavedCount);
    
    // Show end screen
    showScreen('endScreen');
}

function initializeGame() {
    game = new Phaser.Game(config);
    // Expose game instance globally for tests and debug tools
    window.game = game;
    
    // Handle screen resize and orientation changes with improved fullscreen support
    window.addEventListener('resize', () => {
        if (game && game.scene && game.scene.scenes[0]) {
            console.log('Window resize event');
            game.scale.resize(window.innerWidth, window.innerHeight);
            
            // Recalculate map if game is active
            const gameScene = game.scene.scenes[0];
            if (gameScene.scene.isActive()) {
                // Recalculate immediately on resize to keep bounds accurate
                recalculateMapForFullscreen(gameScene);
            }
        }
    });
    
    window.addEventListener('orientationchange', () => {
        console.log('Orientation change event');
        setTimeout(() => {
            if (game && game.scene && game.scene.scenes[0]) {
                console.log('Processing orientation change');
                game.scale.resize(window.innerWidth, window.innerHeight);
                
                // Recalculate map after orientation change
                const gameScene = game.scene.scenes[0];
                if (gameScene.scene.isActive()) {
                    recalculateMapForFullscreen(gameScene);
                }
            }
        }, 200); // Increased timeout for orientation change
    });
}

// Mobile Controls Setup
function setupMobileControls() {
    // Show mobile controls on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    if (isMobile) {
        const mobileControlsElement = document.getElementById('mobileControls');
        if (mobileControlsElement) {
            mobileControlsElement.style.display = 'block';
        }
        
        // Show orientation hint on mobile if in portrait mode
        checkOrientation();
        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 100);
        });
        window.addEventListener('resize', checkOrientation);
        // Setup virtual joystick
        const joystick = document.getElementById('joystick');
        const knob = document.getElementById('joystickKnob');
        if (joystick && knob) {
            const maxRadius = () => Math.min(joystick.clientWidth, joystick.clientHeight) * 0.4;
            const setKnob = (dx, dy) => {
                const r = Math.min(Math.hypot(dx, dy), maxRadius());
                const angle = Math.atan2(dy, dx);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            };
            const updateVector = (clientX, clientY) => {
                const rect = joystick.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = clientX - cx;
                const dy = clientY - cy;
                const r = Math.hypot(dx, dy) || 1;
                const clampR = maxRadius();
                // Normalized direction limited to unit circle
                const nx = dx / r;
                const ny = dy / r;
                // Apply deadzone to reduce jitter
                const dead = 0.12;
                const mag = Math.min(r / clampR, 1);
                const eff = mag < dead ? 0 : (mag - dead) / (1 - dead);
                mobileControls.joystick.dx = dx;
                mobileControls.joystick.dy = dy;
                mobileControls.joystick.normX = nx * eff;
                mobileControls.joystick.normY = ny * eff;
                setKnob(dx, dy);
            };
            const start = (e) => {
                mobileControls.joystick.active = true;
                const pt = (e.touches && e.touches[0]) || e;
                updateVector(pt.clientX, pt.clientY);
            };
            const move = (e) => {
                if (!mobileControls.joystick.active) return;
                const pt = (e.touches && e.touches[0]) || e;
                updateVector(pt.clientX, pt.clientY);
            };
            const end = () => {
                mobileControls.joystick.active = false;
                mobileControls.joystick.dx = mobileControls.joystick.dy = 0;
                mobileControls.joystick.normX = mobileControls.joystick.normY = 0;
                knob.style.transform = 'translate(-50%, -50%)';
            };
            joystick.addEventListener('touchstart', start, { passive: true });
            joystick.addEventListener('touchmove', move, { passive: true });
            joystick.addEventListener('touchend', end, { passive: true });
            joystick.addEventListener('mousedown', start);
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', end);
        } else {
            // Fallback to arrows UI
            const fallback = document.getElementById('fallbackArrows');
            if (fallback) fallback.style.display = 'block';
        }
    }
    
    // Add event listeners for arrow buttons
    const upArrow = document.getElementById('upArrow');
    const downArrow = document.getElementById('downArrow');
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    
    if (upArrow) {
        upArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            mobileControls.up = true;
        });
        upArrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            mobileControls.up = false;
        });
        upArrow.addEventListener('mousedown', (e) => {
            e.preventDefault();
            mobileControls.up = true;
        });
        upArrow.addEventListener('mouseup', (e) => {
            e.preventDefault();
            mobileControls.up = false;
        });
    }
    
    if (downArrow) {
        downArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            mobileControls.down = true;
        });
        downArrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            mobileControls.down = false;
        });
        downArrow.addEventListener('mousedown', (e) => {
            e.preventDefault();
            mobileControls.down = true;
        });
        downArrow.addEventListener('mouseup', (e) => {
            e.preventDefault();
            mobileControls.down = false;
        });
    }
    
    if (leftArrow) {
        leftArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            mobileControls.left = true;
        });
        leftArrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            mobileControls.left = false;
        });
        leftArrow.addEventListener('mousedown', (e) => {
            e.preventDefault();
            mobileControls.left = true;
        });
        leftArrow.addEventListener('mouseup', (e) => {
            e.preventDefault();
            mobileControls.left = false;
        });
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('touchstart', (e) => {
            e.preventDefault();
            mobileControls.right = true;
        });
        rightArrow.addEventListener('touchend', (e) => {
            e.preventDefault();
            mobileControls.right = false;
        });
        rightArrow.addEventListener('mousedown', (e) => {
            e.preventDefault();
            mobileControls.right = true;
        });
        rightArrow.addEventListener('mouseup', (e) => {
            e.preventDefault();
            mobileControls.right = false;
        });
    }
    
    // Handle cases where touch/mouse events get stuck
    document.addEventListener('touchend', () => {
        mobileControls.up = false;
        mobileControls.down = false;
        mobileControls.left = false;
        mobileControls.right = false;
    });
    
    document.addEventListener('mouseup', () => {
        mobileControls.up = false;
        mobileControls.down = false;
        mobileControls.left = false;
        mobileControls.right = false;
    });
}

// Orientation handling functions
function checkOrientation() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    if (isMobile && window.innerHeight > window.innerWidth) {
        // Portrait mode on mobile - show hint
        showOrientationHint();
    } else {
        // Landscape mode or desktop - hide hint
        hideOrientationHint();
    }
}

function showOrientationHint() {
    const hint = document.getElementById('orientationHint');
    if (hint) {
        hint.classList.add('show');
    }
}

function hideOrientationHint() {
    const hint = document.getElementById('orientationHint');
    if (hint) {
        hint.classList.remove('show');
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    // Don't initialize the game immediately - wait for start button
    setupFullscreen(); // Setup fullscreen functionality
});