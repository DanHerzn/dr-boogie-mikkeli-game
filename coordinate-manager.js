/**
 * Coordinate System Manager
 * Handles coordinate transformations and maintains accuracy across orientation changes
 */

class CoordinateManager {
    constructor() {
        this.baseMapDimensions = { width: 1200, height: 800 };
        this.currentTransform = {
            scale: 1,
            offsetX: 0,
            offsetY: 0
        };
        this.coordinateHistory = [];
        this.maxHistorySize = 10;
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
        const scaleX = screenWidth / this.baseMapDimensions.width;
        const scaleY = screenHeight / this.baseMapDimensions.height;
        let scale = Math.min(scaleX, scaleY);
        
        if (isMobile) {
            const isLandscape = screenWidth > screenHeight;
            
            if (isLandscape) {
                scale = Math.min(scaleX * 0.95, scaleY * 0.90);
                scale = Math.max(0.5, Math.min(scale, 1.0));
            } else {
                scale = Math.max(0.4, Math.min(scale, 0.8));
            }
        } else {
            // Desktop scaling
            scale = Math.min(scale, 0.98);
        }
        
        return scale;
    }
    
    /**
     * Calculate centered offset for map positioning
     */
    calculateCenteredOffset(scale, screenWidth, screenHeight) {
        const scaledMapWidth = this.baseMapDimensions.width * scale;
        const scaledMapHeight = this.baseMapDimensions.height * scale;
        
        return {
            offsetX: (screenWidth - scaledMapWidth) / 2,
            offsetY: (screenHeight - scaledMapHeight) / 2
        };
    }
    
    /**
     * Validate coordinates are within map bounds
     */
    isWithinMapBounds(mapX, mapY) {
        return mapX >= 0 && mapX <= this.baseMapDimensions.width &&
               mapY >= 0 && mapY <= this.baseMapDimensions.height;
    }
    
    /**
     * Clamp coordinates to map bounds
     */
    clampToMapBounds(mapX, mapY) {
        return {
            x: Math.max(0, Math.min(mapX, this.baseMapDimensions.width)),
            y: Math.max(0, Math.min(mapY, this.baseMapDimensions.height))
        };
    }
    
    /**
     * Get distance between two map coordinates
     */
    getMapDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get distance between two screen coordinates
     */
    getScreenDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Export for use in main game
window.CoordinateManager = CoordinateManager;