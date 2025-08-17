/**
 * Coordinate System Manager
 * Handles coordinate transformations and maintains accuracy across orientation changes
 */

class CoordinateManager {
    constructor() {
        // Will be set dynamically when map loads
        this.baseMapWidth = 1200; // Default, will be updated
        this.baseMapHeight = 800; // Default, will be updated
        this.currentTransform = {
            scale: 1,
            offsetX: 0,
            offsetY: 0
        };
        this.coordinateHistory = [];
        this.maxHistorySize = 10;
    }
    
    /**
     * Initialize with actual map dimensions
     */
    initialize(mapWidth, mapHeight) {
        this.baseMapWidth = mapWidth;
        this.baseMapHeight = mapHeight;
        console.log(`CoordinateManager initialized with map dimensions: ${mapWidth}x${mapHeight}`);
    }
    
    /**
     * Convert map coordinates to screen coordinates
     */
    mapToScreen(mapX, mapY) {
        return {
            x: this.currentTransform.offsetX + (mapX * this.currentTransform.scale),
            y: this.currentTransform.offsetY + (mapY * this.currentTransform.scale)
        };
    }
    
    /**
     * Convert screen coordinates to map coordinates
     */
    screenToMap(screenX, screenY) {
        return {
            x: (screenX - this.currentTransform.offsetX) / this.currentTransform.scale,
            y: (screenY - this.currentTransform.offsetY) / this.currentTransform.scale
        };
    }
    
    /**
     * Update transformation matrix
     */
    updateTransform(scale, offsetX, offsetY) {
        // Store previous transform in history
        this.coordinateHistory.push({
            ...this.currentTransform,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.coordinateHistory.length > this.maxHistorySize) {
            this.coordinateHistory.shift();
        }
        
        // Update current transform
        this.currentTransform = { scale, offsetX, offsetY };
        
        console.log('Transform updated:', this.currentTransform);
    }
    
    /**
     * Get current transform
     */
    getTransform() {
        return { ...this.currentTransform };
    }
    
    /**
     * Restore previous transform (useful for error recovery)
     */
    restorePreviousTransform() {
        if (this.coordinateHistory.length > 0) {
            this.currentTransform = this.coordinateHistory.pop();
            console.log('Transform restored:', this.currentTransform);
            return true;
        }
        return false;
    }
    
    /**
     * Calculate optimal scaling for given screen dimensions
     */
    calculateOptimalScale(screenWidth, screenHeight, isMobile = false) {
        const scaleX = screenWidth / this.baseMapWidth;
        const scaleY = screenHeight / this.baseMapHeight;
        let scale = Math.min(scaleX, scaleY);
        
        if (isMobile) {
            const isLandscape = screenWidth > screenHeight;
            const mapIsPortrait = this.baseMapHeight > this.baseMapWidth;
            
            if (isLandscape) {
                // In landscape mode, use more of the available space
                scale = Math.min(scaleX * 0.95, scaleY * 0.90);
                // Ensure minimum visibility
                if (scale < 0.5) scale = 0.5;
                else if (scale > 1.0) scale = 1.0;
            } else if (mapIsPortrait) {
                // In portrait mode, use conservative scaling
                if (scale < 0.4) scale = 0.4;
                else if (scale > 0.8) scale = 0.8;
            }
        } else {
            // Desktop - use full available space (no artificial cap)
            // Keep the map fully visible while maximizing size
            scale = Math.min(scaleX, scaleY);
        }
        
        return scale;
    }
    
    /**
     * Calculate centered offset for map positioning
     */
    calculateCenteredOffset(scale, screenWidth, screenHeight) {
        const scaledMapWidth = this.baseMapWidth * scale;
        const scaledMapHeight = this.baseMapHeight * scale;
        
        return {
            offsetX: (screenWidth - scaledMapWidth) / 2,
            offsetY: (screenHeight - scaledMapHeight) / 2
        };
    }
    
    /**
     * Get map bounds in screen coordinates
     */
    getMapBounds() {
        return {
            left: this.currentTransform.offsetX,
            right: this.currentTransform.offsetX + (this.baseMapWidth * this.currentTransform.scale),
            top: this.currentTransform.offsetY,
            bottom: this.currentTransform.offsetY + (this.baseMapHeight * this.currentTransform.scale)
        };
    }
    
    /**
     * Validate coordinates are within map bounds
     */
    isWithinMapBounds(mapX, mapY) {
        return mapX >= 0 && mapX <= this.baseMapWidth &&
               mapY >= 0 && mapY <= this.baseMapHeight;
    }
    
    /**
     * Clamp coordinates to map bounds
     */
    clampToMapBounds(mapX, mapY) {
        return {
            x: Math.max(0, Math.min(mapX, this.baseMapWidth)),
            y: Math.max(0, Math.min(mapY, this.baseMapHeight))
        };
    }
    
    /**
     * Calculate distance between two points in map coordinates
     */
    getMapDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calculate distance between two points in screen coordinates
     */
    getScreenDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Export for global access
window.CoordinateManager = CoordinateManager;