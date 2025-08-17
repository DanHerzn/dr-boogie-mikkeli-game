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
        autoCenter: Phaser.Scale.CENTER_BOTH
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
    // Create background using the actual Mikkeli map
    const mapSprite = this.add.image(0, 0, 'mikkeliMap');
    mapSprite.setOrigin(0, 0);
    
    // Scale the map to fit the screen while maintaining aspect ratio
    const scaleX = this.scale.width / mapSprite.width;
    const scaleY = this.scale.height / mapSprite.height;
    const scale = Math.min(scaleX, scaleY);
    mapSprite.setScale(scale);
    
    // Center the map
    mapSprite.x = (this.scale.width - mapSprite.displayWidth) / 2;
    mapSprite.y = (this.scale.height - mapSprite.displayHeight) / 2;
    
    // Store map transform for landmark positioning
    this.mapScale = scale;
    this.mapOffsetX = mapSprite.x;
    this.mapOffsetY = mapSprite.y;

    // Create player (Dr Boogie) - can now move freely anywhere on the map
    const startX = this.mapOffsetX + (200 * this.mapScale);
    const startY = this.mapOffsetY + (300 * this.mapScale);
    player = this.physics.add.sprite(startX, startY, 'drBoogie');
    player.setCollideWorldBounds(true);
    player.setScale(0.15); // Made Dr Boogie smaller (was 0.3)
    player.body.setSize(player.width * 0.8, player.height * 0.8); // Adjust collision box

    // Create landmarks as invisible collision areas with dot overlays
    landmarks = this.physics.add.group();
    
    landmarkData.forEach((landmarkInfo, index) => {
        // Transform landmark coordinates to screen coordinates
        const screenX = this.mapOffsetX + (landmarkInfo.x * this.mapScale);
        const screenY = this.mapOffsetY + (landmarkInfo.y * this.mapScale);
        
    // Create invisible circular collision area, centered
    const landmark = this.physics.add.sprite(screenX, screenY, null);
    landmark.setImmovable(true);
    landmark.landmarkData = landmarkInfo;
    landmark.setVisible(false); // Make it invisible
    landmark.body.setCircle(40); // 40px radius circle, centered
    landmark.body.setOffset(0, 0); // No offset needed for circle collision
    landmark.scene = this; // Store scene reference
    landmarks.add(landmark);

    // Create colored dot overlay for visual feedback
    const dotOverlay = this.add.graphics();
    dotOverlay.x = screenX;
    dotOverlay.y = screenY;
    landmark.dotOverlay = dotOverlay;
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
            // Remove disasters that go off screen
            if (disaster.x < -50 || disaster.x > game.scale.width + 50 || 
                disaster.y < -50 || disaster.y > game.scale.height + 50) {
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
    
    // Random spawn position from screen edges
    let x, y, velocityX = 0, velocityY = 0;
    const speedMultiplier = difficultySettings[difficulty].disasterSpeed;
    
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
        case 0: // Top
            x = Phaser.Math.Between(0, game.scale.width);
            y = -50;
            velocityY = Phaser.Math.Between(80, 200) * speedMultiplier;
            break;
        case 1: // Right
            x = game.scale.width + 50;
            y = Phaser.Math.Between(0, game.scale.height);
            velocityX = Phaser.Math.Between(-200, -80) * speedMultiplier;
            break;
        case 2: // Bottom
            x = Phaser.Math.Between(0, game.scale.width);
            y = game.scale.height + 50;
            velocityY = Phaser.Math.Between(-200, -80) * speedMultiplier;
            break;
        case 3: // Left
            x = -50;
            y = Phaser.Math.Between(0, game.scale.height);
            velocityX = Phaser.Math.Between(80, 200) * speedMultiplier;
            break;
    }

    const disaster = disasters.create(x, y, type);
    disaster.disasterType = type;
    
    // Store original velocity and set current velocity
    disaster.originalVelocityX = velocityX;
    disaster.originalVelocityY = velocityY;
    
    // If frozen, don't move initially
    if (isFrozen) {
        disaster.setVelocity(0, 0);
    } else {
        disaster.setVelocity(velocityX, velocityY);
    }
    
    // Scale disaster images to appropriate size
    if (type === 'meteor') {
        disaster.setScale(0.2); // Made meteors bigger (was 0.1)
    } else if (type === 'storm') {
        disaster.setScale(0.15); // Scale storm image appropriately
    } else if (type === 'flood') {
        disaster.setScale(0.2); // Made flood image smaller (was 0.8)
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
    const text = scene.add.text(landmark.x, landmark.y - 30, 'SAVED! +50', {
        fontSize: '20px',
        fill: '#00FF00',
        fontStyle: 'bold'
    });
    
    scene.tweens.add({
        targets: text,
        y: text.y - 50,
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
    const text = scene.add.text(player.x, player.y - 30, 'BLOCKED! +10', {
        fontSize: '16px',
        fill: '#00FF00',
        fontStyle: 'bold'
    });
    
    scene.tweens.add({
        targets: text,
        y: text.y - 50,
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
        const text = scene.add.text(landmark.x, landmark.y - 30, 'SHIELD BLOCKED!', {
            fontSize: '14px',
            fill: '#FFD700',
            fontStyle: 'bold'
        });
        
        scene.tweens.add({
            targets: text,
            y: text.y - 50,
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
    const text = scene.add.text(landmark.x, landmark.y - 30, 'DESTROYED! -20', {
        fontSize: '16px',
        fill: '#FF0000',
        fontStyle: 'bold'
    });
    
    scene.tweens.add({
        targets: text,
        y: text.y - 50,
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
    
    // Random position on map (avoid edges)
    const margin = 100;
    const x = Phaser.Math.Between(margin, game.scale.width - margin);
    const y = Phaser.Math.Between(margin, game.scale.height - margin);
    
    const freezePowerUp = powerUps.create(x, y, 'freeze');
    freezePowerUp.setScale(0.12); // Made bigger (was 0.08)
    freezePowerUp.powerType = 'freeze';
    freezePowerUp.spawnTime = Date.now();
    
    // Add gentle floating animation
    game.scene.getScene('default').tweens.add({
        targets: freezePowerUp,
        y: y - 10,
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
    const offsetX = Phaser.Math.Between(-50, 50);
    const offsetY = Phaser.Math.Between(-50, 50);
    
    const shieldPowerUp = powerUps.create(
        targetLandmark.x + offsetX, 
        targetLandmark.y + offsetY, 
        'shield'
    );
    shieldPowerUp.setScale(0.1); // Made bigger (was 0.06)
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
        const text = scene.add.text(powerUp.x, powerUp.y - 30, 'TIME FREEZE!', {
            fontSize: '18px',
            fill: '#00FFFF',
            fontStyle: 'bold'
        });
        
        scene.tweens.add({
            targets: text,
            y: text.y - 50,
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
            const text = scene.add.text(powerUp.x, powerUp.y - 30, 'SHIELD ACTIVE!', {
                fontSize: '16px',
                fill: '#FFD700',
                fontStyle: 'bold'
            });
            
            scene.tweens.add({
                targets: text,
                y: text.y - 50,
                alpha: 0,
                duration: 2000,
                onComplete: () => text.destroy()
            });
        }
    }
    
    powerUp.destroy();
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

// Initialize when page loads
window.addEventListener('load', () => {
    // Don't initialize the game immediately - wait for start button
});