// UI Management and Firebase Integration

// Firebase configuration (you'll need to replace with your own config)
const firebaseConfig = {
    // Replace these with your actual Firebase config
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase (only if config is provided)
let db = null;
let isFirebaseEnabled = false;

function initializeFirebase() {
    try {
        if (firebaseConfig.apiKey !== "your-api-key") {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            isFirebaseEnabled = true;
            console.log("Firebase initialized successfully");
        } else {
            console.log("Firebase not configured - using local storage for leaderboard");
        }
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        isFirebaseEnabled = false;
    }
}

// Screen management
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
    
    // Handle screen-specific actions
    if (screenId === 'gameScreen') {
        if (!game) {
            initializeGame();
        }
        startGame();
    } else if (screenId === 'leaderboardScreen') {
        loadLeaderboard();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    
    // Start button
    document.getElementById('startButton').addEventListener('click', () => {
        const teamName = document.getElementById('teamName').value.trim();
        if (!teamName) {
            alert('Please enter a team name!');
            return;
        }
        if (teamName.length > 20) {
            alert('Team name must be 20 characters or less!');
            return;
        }
        
        // Get selected difficulty
        difficulty = document.getElementById('difficulty').value;
        
        showScreen('gameScreen');
    });
    
    // Play again button
    document.getElementById('playAgainButton').addEventListener('click', () => {
        showScreen('startScreen');
    });
    
    // View leaderboard button
    document.getElementById('viewLeaderboardButton').addEventListener('click', () => {
        showScreen('leaderboardScreen');
    });
    
    // Back to menu button
    document.getElementById('backToMenuButton').addEventListener('click', () => {
        showScreen('startScreen');
    });
    
    // Enter key on team name input
    document.getElementById('teamName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('startButton').click();
        }
    });
    
    // Prevent zoom on double tap (mobile)
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// Leaderboard functions
async function saveScore(teamName, score, landmarksSaved) {
    const scoreData = {
        teamName: teamName,
        score: score,
        landmarksSaved: landmarksSaved,
        difficulty: difficulty || 'medium',
        gameDuration: 60,
        timestamp: Date.now(),
        date: new Date().toISOString()
    };
    
    try {
        // Try to save to backend API first
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scoreData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log("Score saved to backend:", result);
        } else {
            throw new Error(`Backend save failed: ${response.status}`);
        }
    } catch (error) {
        console.error("Error saving score to backend:", error);
        // Fallback to local storage
        saveScoreLocally(scoreData);
    }
}

function saveScoreLocally(scoreData) {
    let leaderboard = JSON.parse(localStorage.getItem('drBoogieLeaderboard') || '[]');
    leaderboard.push(scoreData);
    
    // Keep only top 100 scores
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 100);
    
    localStorage.setItem('drBoogieLeaderboard', JSON.stringify(leaderboard));
    console.log("Score saved locally");
}

async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div class="loading">Loading scores...</div>';
    
    let scores = [];
    
    try {
        // Try to load from backend API first
        const response = await fetch('/api/leaderboard?limit=50');
        if (response.ok) {
            const data = await response.json();
            scores = data.leaderboard.map(entry => ({
                teamName: entry.teamName,
                score: entry.score,
                landmarksSaved: entry.landmarksSaved,
                difficulty: entry.difficulty,
                timestamp: entry.timestamp
            }));
            console.log("Leaderboard loaded from backend");
        } else {
            throw new Error(`Backend load failed: ${response.status}`);
        }
    } catch (error) {
        console.error("Error loading backend leaderboard:", error);
        // Fallback to local storage
        scores = loadLeaderboardLocally();
    }
    
    displayLeaderboard(scores);
}

function loadLeaderboardLocally() {
    const scores = JSON.parse(localStorage.getItem('drBoogieLeaderboard') || '[]');
    console.log("Leaderboard loaded locally");
    return scores.slice(0, 50); // Top 50
}

function displayLeaderboard(scores) {
    const leaderboardList = document.getElementById('leaderboardList');
    const currentTeam = document.getElementById('teamName').value.trim();
    
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<div class="loading">No scores yet. Be the first to play!</div>';
        return;
    }
    
    let html = '';
    scores.forEach((score, index) => {
        const isCurrentTeam = score.teamName === currentTeam;
        const entryClass = isCurrentTeam ? 'leaderboard-entry current-team' : 'leaderboard-entry';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const difficultyIcon = score.difficulty === 'easy' ? '🟢' : score.difficulty === 'hard' ? '🔴' : '🟡';
        
        html += `
            <div class="${entryClass}">
                <span>${medal} ${index + 1}. ${escapeHtml(score.teamName)} ${difficultyIcon}</span>
                <span>${score.score} pts (${score.landmarksSaved}/13 saved)</span>
            </div>
        `;
    });
    
    leaderboardList.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Resize handling for responsive design
function handleResize() {
    if (game && game.scale) {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Performance optimization for mobile
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // We could register a service worker here for offline play
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Analytics and error tracking (placeholder)
function trackEvent(eventName, parameters = {}) {
    console.log(`Event: ${eventName}`, parameters);
    // You could integrate with Google Analytics or other tracking here
}

function trackError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    // You could integrate with error tracking services here
}

// Add some helpful debugging
window.gameDebug = {
    getGameState: () => ({
        isGameRunning,
        score,
        gameTimer,
        landmarksSavedCount,
        disasterCount: disasters ? disasters.children.entries.length : 0
    }),
    addScore: (points) => {
        score += points;
        updateUI();
    },
    endGame: () => endGame(),
    resetLeaderboard: () => {
        localStorage.removeItem('drBoogieLeaderboard');
        console.log('Local leaderboard reset');
    }
};

console.log('Dr Boogie game loaded! Access debug functions via window.gameDebug');