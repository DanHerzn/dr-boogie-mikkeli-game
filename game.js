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
    right: false
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
    }
    if (!mobileHandler) {
        mobileHandler = new MobileHandler();
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
    
    // Set collision box size based on the scaled player size
    const scaledPlayerWidth = player.width * playerScale;
    const scaledPlayerHeight = player.height * playerScale;
    player.body.setSize(scaledPlayerWidth * 0.8, scaledPlayerHeight * 0.8);
    // Center the collision box properly
    player.body.setOffset(
        (player.width - scaledPlayerWidth * 0.8) / 2,
        (player.height - scaledPlayerHeight * 0.8) / 2
    );

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
        landmark.body.setCircle(landmarkRadius); // Scaled radius circle, centered
        landmark.body.setOffset(0, 0); // No offset needed for circle collision
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
                this.physics.moveToObject(player, { x: targetX, y: targetY }, 200);
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

    // Keyboard and mobile controls
    if (cursors.left.isDown || mobileControls.left) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown || mobileControls.right) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown || mobileControls.up) {
        player.setVelocityY(-200);
    } else if (cursors.down.isDown || mobileControls.down) {
        player.setVelocityY(200);
    } else {
        player.setVelocityY(0);
    }

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
                disaster.destroy();
            }
        }
    });
    
    // Update power-ups - remove if they go off screen or are too old
    powerUps.children.entries.forEach(powerUp => {
        if (powerUp.active) {
            powerUp.spawnTime = powerUp.spawnTime || Date.now();
            // Remove power-ups after 15 seconds
            if (Date.now() - powerUp.spawnTime > 15000) {
                powerUp.destroy();
            }
        }
    });
}

function spawnDisaster() {
    if (!isGameRunning || isFrozen) return; // Don't spawn disasters during freeze

    const disasterTypes = ['meteor', 'flood', 'storm'];
    const type = Phaser.Utils.Array.GetRandom(disasterTypes);
    
    // Get map boundaries using coordinate manager
    const scene = game.scene.getScene('default');
    const mapBounds = coordinateManager.getMapBounds();
    
    // Spawn disasters from edges of the map area (not screen edges)
    let mapX, mapY, velocityX = 0, velocityY = 0;
    const speedMultiplier = difficultySettings[difficulty].disasterSpeed;
    
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
        case 0: // Top edge of map
            mapX = Phaser.Math.Between(0, coordinateManager.baseMapWidth);
            mapY = -50 / scene.mapScale; // Convert screen pixels to map coordinates
            velocityY = Phaser.Math.Between(80, 200) * speedMultiplier;
            break;
        case 1: // Right edge of map
            mapX = coordinateManager.baseMapWidth + (50 / scene.mapScale);
            mapY = Phaser.Math.Between(0, coordinateManager.baseMapHeight);
            velocityX = Phaser.Math.Between(-200, -80) * speedMultiplier;
            break;
        case 2: // Bottom edge of map
            mapX = Phaser.Math.Between(0, coordinateManager.baseMapWidth);
            mapY = coordinateManager.baseMapHeight + (50 / scene.mapScale);
            velocityY = Phaser.Math.Between(-200, -80) * speedMultiplier;
            break;
        case 3: // Left edge of map
            mapX = -50 / scene.mapScale;
            mapY = Phaser.Math.Between(0, coordinateManager.baseMapHeight);
            velocityX = Phaser.Math.Between(80, 200) * speedMultiplier;
            break;
    }

    // Convert map coordinates to screen coordinates
    const screenPos = coordinateManager.mapToScreen(mapX, mapY);
    const disaster = disasters.create(screenPos.x, screenPos.y, type);
    disaster.disasterType = type;
    
    // Store original map coordinates for coordinate manager tracking
    disaster.originalMapX = mapX;
    disaster.originalMapY = mapY;
    
    // Store original velocity
    disaster.originalVelocityX = velocityX;
    disaster.originalVelocityY = velocityY;
    
    // Track disaster with mobile handler
    mobileHandler.addElementToTrack(disaster, 'disaster', {
        mapX: mapX,
        mapY: mapY
    });
    
    // If frozen, don't move initially
    if (isFrozen) {
        disaster.setVelocity(0, 0);
    } else {
        disaster.setVelocity(velocityX, velocityY);
    }
    
    // Scale disaster images proportionally to map scale, smaller in portrait mode
    const sceneForScale = game.scene.getScene('default');
    const isPortrait = sceneForScale.scale.height > sceneForScale.scale.width;
    const portraitReduction = isPortrait ? 0.7 : 1.0; // 30% smaller in portrait
    const scaleMultiplier = Math.max(0.5, sceneForScale.mapScale) * portraitReduction;
    
    let disasterScale;
    if (type === 'meteor') {
        disasterScale = 0.2 * scaleMultiplier;
        disaster.setScale(disasterScale);
    } else if (type === 'storm') {
        disasterScale = 0.15 * scaleMultiplier;
        disaster.setScale(disasterScale);
    } else if (type === 'flood') {
        disasterScale = 0.2 * scaleMultiplier;
        disaster.setScale(disasterScale);
    }
    
    // Set collision box based on the scaled disaster size
    if (disaster.body) {
        const scaledDisasterWidth = disaster.width * disasterScale;
        const scaledDisasterHeight = disaster.height * disasterScale;
        disaster.body.setSize(scaledDisasterWidth * 0.8, scaledDisasterHeight * 0.8);
        disaster.body.setOffset(
            (disaster.width - scaledDisasterWidth * 0.8) / 2,
            (disaster.height - scaledDisasterHeight * 0.8) / 2
        );
    }
    
    // Add some random movement for more dynamic disasters
    if (type === 'storm') {
        disaster.setAngularVelocity(100);
    } else if (type === 'flood') {
        disaster.setAngularVelocity(50);
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
    
    disaster.destroy();
    updateUI();
}

function destroyLandmark(landmark, disaster) {
    // Check if landmark is already destroyed to prevent multiple penalties
    if (landmark.landmarkData.destroyed) {
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
            disaster.destroy();
        });
        
        // Clear existing power-ups
        powerUps.children.entries.forEach(powerUp => {
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
    const screenPos = coordinateManager.mapToScreen(mapX, mapY);
    const freezePowerUp = powerUps.create(screenPos.x, screenPos.y, 'freeze');
    
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
    
    // Set collision box based on the scaled power-up size
    if (freezePowerUp.body) {
        const scaledPowerUpWidth = freezePowerUp.width * powerUpScale;
        const scaledPowerUpHeight = freezePowerUp.height * powerUpScale;
        freezePowerUp.body.setSize(scaledPowerUpWidth, scaledPowerUpHeight);
        freezePowerUp.body.setOffset(
            (freezePowerUp.width - scaledPowerUpWidth) / 2,
            (freezePowerUp.height - scaledPowerUpHeight) / 2
        );
    }
    
    freezePowerUp.powerType = 'freeze';
    freezePowerUp.spawnTime = Date.now();
    
    // Add gentle floating animation
    game.scene.getScene('default').tweens.add({
        targets: freezePowerUp,
        y: screenPos.y - 10,
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
    const screenPos = coordinateManager.mapToScreen(shieldMapX, shieldMapY);
    const shieldPowerUp = powerUps.create(screenPos.x, screenPos.y, 'shield');
    
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
    
    // Set collision box based on the scaled shield power-up size
    if (shieldPowerUp.body) {
        const scaledShieldWidth = shieldPowerUp.width * shieldScale;
        const scaledShieldHeight = shieldPowerUp.height * shieldScale;
        shieldPowerUp.body.setSize(scaledShieldWidth, scaledShieldHeight);
        shieldPowerUp.body.setOffset(
            (shieldPowerUp.width - scaledShieldWidth) / 2,
            (shieldPowerUp.height - scaledShieldHeight) / 2
        );
    }
    
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
        
        // Map original dimensions (adjust these based on your actual map size)
        const mapWidth = 1200;  // Adjust to your map's actual width
        const mapHeight = 800;  // Adjust to your map's actual height
        
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
        
        console.log(`New map scale: ${scale}, offset: (${scene.mapOffsetX}, ${scene.mapOffsetY})`);
        
        // Update map sprite if it exists (origin 0,0 as in create)
        if (scene.mapSprite) {
            scene.mapSprite.setOrigin(0, 0);
            scene.mapSprite.setScale(scale);
            scene.mapSprite.x = scene.mapOffsetX;
            scene.mapSprite.y = scene.mapOffsetY;
        }
        
        // Update player scale and position if exists
        if (player) {
            const isPortrait = screenHeight > screenWidth;
            const portraitReduction = isPortrait ? 0.5 : 1.0;
            const playerScale = 0.15 * Math.max(0.6, scale) * portraitReduction;
            player.setScale(playerScale);
            
            // Update player collision box to match new scale
            if (player.body) {
                const playerWidth = player.width * playerScale;
                const playerHeight = player.height * playerScale;
                player.body.setSize(playerWidth * 0.8, playerHeight * 0.8);
                // Center the collision box
                player.body.setOffset(
                    (player.width - playerWidth * 0.8) / 2,
                    (player.height - playerHeight * 0.8) / 2
                );
            }
        }
        
        // Update landmarks positions and scales
        if (landmarks && landmarks.children && landmarks.children.entries) {
            landmarks.children.entries.forEach((landmark, index) => {
                if (landmark.landmarkData) {
                    const screenX = scene.mapOffsetX + (landmark.landmarkData.x * scale);
                    const screenY = scene.mapOffsetY + (landmark.landmarkData.y * scale);
                    
                    landmark.setPosition(screenX, screenY);
                    
                    // Update collision radius and body
                    const landmarkRadius = Math.max(20, 40 * scale);
                    if (landmark.body) {
                        landmark.body.setCircle(landmarkRadius);
                        landmark.body.setOffset(0, 0); // Center the circle
                    }
                    
                    // Update dot overlay position
                    if (landmark.dotOverlay) {
                        landmark.dotOverlay.x = screenX;
                        landmark.dotOverlay.y = screenY;
                        
                        // Redraw dot overlay with new scale
                        const color = landmark.landmarkData.saved ? 
                            (landmark.landmarkData.destroyed ? 0xFF0000 : 0x00FF00) : 0xFFFF00;
                        drawDotOverlay(landmark.dotOverlay, color, scale);
                    }
                }
            });
        }
        
        // Update disasters positions and scales
        if (disasters && disasters.children && disasters.children.entries) {
            disasters.children.entries.forEach((disaster) => {
                if (disaster.originalX !== undefined && disaster.originalY !== undefined) {
                    const screenX = scene.mapOffsetX + (disaster.originalX * scale);
                    const screenY = scene.mapOffsetY + (disaster.originalY * scale);
                    disaster.setPosition(screenX, screenY);
                    
                    const isPortrait = screenHeight > screenWidth;
                    const portraitReduction = isPortrait ? 0.5 : 1.0;
                    const disasterScale = 0.06 * Math.max(0.7, scale) * portraitReduction;
                    disaster.setScale(disasterScale);
                    
                    // Update collision box for disasters
                    if (disaster.body) {
                        const disasterWidth = disaster.width * disasterScale;
                        const disasterHeight = disaster.height * disasterScale;
                        disaster.body.setSize(disasterWidth * 0.8, disasterHeight * 0.8);
                        disaster.body.setOffset(
                            (disaster.width - disasterWidth * 0.8) / 2,
                            (disaster.height - disasterHeight * 0.8) / 2
                        );
                    }
                }
            });
        }
        
        // Update power-ups positions and scales
        if (powerUps && powerUps.children && powerUps.children.entries) {
            powerUps.children.entries.forEach((powerUp) => {
                if (powerUp.originalX !== undefined && powerUp.originalY !== undefined) {
                    const screenX = scene.mapOffsetX + (powerUp.originalX * scale);
                    const screenY = scene.mapOffsetY + (powerUp.originalY * scale);
                    powerUp.setPosition(screenX, screenY);
                    
                    const isPortrait = screenHeight > screenWidth;
                    const portraitReduction = isPortrait ? 0.6 : 1.0;
                    const powerUpScale = 0.08 * Math.max(0.7, scale) * portraitReduction;
                    powerUp.setScale(powerUpScale);
                    
                    // Update collision box for power-ups
                    if (powerUp.body) {
                        const powerUpWidth = powerUp.width * powerUpScale;
                        const powerUpHeight = powerUp.height * powerUpScale;
                        powerUp.body.setSize(powerUpWidth, powerUpHeight);
                        powerUp.body.setOffset(
                            (powerUp.width - powerUpWidth) / 2,
                            (powerUp.height - powerUpHeight) / 2
                        );
                    }
                }
            });
        }
        
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
    
    // Handle screen resize and orientation changes with improved fullscreen support
    window.addEventListener('resize', () => {
        if (game && game.scene && game.scene.scenes[0]) {
            console.log('Window resize event');
            game.scale.resize(window.innerWidth, window.innerHeight);
            
            // Recalculate map if game is active
            const gameScene = game.scene.scenes[0];
            if (gameScene.scene.isActive()) {
                setTimeout(() => {
                    recalculateMapForFullscreen(gameScene);
                }, 50);
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