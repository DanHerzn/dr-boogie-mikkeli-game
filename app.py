from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import sqlite3
import datetime
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
DATABASE = 'game_scores.db'

def init_db():
    """Initialize the database with the scores table"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            landmarks_saved INTEGER NOT NULL,
            difficulty TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            game_duration INTEGER DEFAULT 60
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Serve the main game page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, images)"""
    return send_from_directory('.', filename)

@app.route('/api/scores', methods=['POST'])
def save_score():
    """Save a new game score"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['teamName', 'score', 'landmarksSaved']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        team_name = data['teamName']
        score = int(data['score'])
        landmarks_saved = int(data['landmarksSaved'])
        difficulty = data.get('difficulty', 'medium')
        game_duration = data.get('gameDuration', 60)
        timestamp = datetime.datetime.now().isoformat()
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO scores (team_name, score, landmarks_saved, difficulty, timestamp, game_duration)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (team_name, score, landmarks_saved, difficulty, timestamp, game_duration))
        conn.commit()
        score_id = cursor.lastrowid
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Score saved successfully',
            'id': score_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scores', methods=['GET'])
def get_scores():
    """Get all scores with optional filtering"""
    try:
        difficulty = request.args.get('difficulty')
        limit = request.args.get('limit', 50)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if difficulty:
            cursor.execute('''
                SELECT * FROM scores 
                WHERE difficulty = ? 
                ORDER BY score DESC, timestamp DESC 
                LIMIT ?
            ''', (difficulty, limit))
        else:
            cursor.execute('''
                SELECT * FROM scores 
                ORDER BY score DESC, timestamp DESC 
                LIMIT ?
            ''', (limit,))
        
        scores = []
        for row in cursor.fetchall():
            scores.append({
                'id': row['id'],
                'teamName': row['team_name'],
                'score': row['score'],
                'landmarksSaved': row['landmarks_saved'],
                'difficulty': row['difficulty'],
                'timestamp': row['timestamp'],
                'gameDuration': row['game_duration']
            })
        
        conn.close()
        return jsonify({'scores': scores}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/leaderboard')
def get_leaderboard():
    """Get top scores for leaderboard display"""
    try:
        difficulty = request.args.get('difficulty', 'all')
        limit = int(request.args.get('limit', 10))
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if difficulty == 'all':
            cursor.execute('''
                SELECT team_name, score, landmarks_saved, difficulty, timestamp
                FROM scores 
                ORDER BY score DESC 
                LIMIT ?
            ''', (limit,))
        else:
            cursor.execute('''
                SELECT team_name, score, landmarks_saved, difficulty, timestamp
                FROM scores 
                WHERE difficulty = ?
                ORDER BY score DESC 
                LIMIT ?
            ''', (difficulty, limit))
        
        leaderboard = []
        for i, row in enumerate(cursor.fetchall(), 1):
            leaderboard.append({
                'rank': i,
                'teamName': row['team_name'],
                'score': row['score'],
                'landmarksSaved': row['landmarks_saved'],
                'difficulty': row['difficulty'],
                'timestamp': row['timestamp']
            })
        
        conn.close()
        return jsonify({'leaderboard': leaderboard}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """Get game statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total games played
        cursor.execute('SELECT COUNT(*) as total FROM scores')
        total_games = cursor.fetchone()['total']
        
        # Average score
        cursor.execute('SELECT AVG(score) as avg_score FROM scores')
        avg_score = cursor.fetchone()['avg_score'] or 0
        
        # Highest score
        cursor.execute('SELECT MAX(score) as max_score FROM scores')
        max_score = cursor.fetchone()['max_score'] or 0
        
        # Total landmarks saved
        cursor.execute('SELECT SUM(landmarks_saved) as total_landmarks FROM scores')
        total_landmarks = cursor.fetchone()['total_landmarks'] or 0
        
        # Games by difficulty
        cursor.execute('''
            SELECT difficulty, COUNT(*) as count 
            FROM scores 
            GROUP BY difficulty
        ''')
        difficulty_stats = {row['difficulty']: row['count'] for row in cursor.fetchall()}
        
        conn.close()
        
        return jsonify({
            'totalGames': total_games,
            'averageScore': round(avg_score, 1),
            'highestScore': max_score,
            'totalLandmarksSaved': total_landmarks,
            'gamesByDifficulty': difficulty_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/leaderboard')
def leaderboard_page():
    """Serve a simple leaderboard page"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dr Boogie vs. The Catastrophes of Mikkeli - Leaderboard</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f0f8ff; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #2c3e50; text-align: center; }
            .difficulty-tabs { margin: 20px 0; text-align: center; }
            .tab { padding: 10px 20px; margin: 0 5px; background: #3498db; color: white; border: none; cursor: pointer; border-radius: 5px; }
            .tab.active { background: #2980b9; }
            .leaderboard { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .score-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
            .rank { font-weight: bold; color: #e74c3c; }
            .team-name { flex-grow: 1; margin-left: 10px; }
            .score { color: #27ae60; font-weight: bold; }
            .back-button { background: #95a5a6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0; display: inline-block; }
            .stats { background: white; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Dr Boogie Leaderboard 🏆</h1>
            
            <div class="stats" id="stats">
                <h3>Game Statistics</h3>
                <div id="statsContent">Loading...</div>
            </div>
            
            <div class="difficulty-tabs">
                <button class="tab active" onclick="loadLeaderboard('all')">All Difficulties</button>
                <button class="tab" onclick="loadLeaderboard('easy')">Easy</button>
                <button class="tab" onclick="loadLeaderboard('medium')">Medium</button>
                <button class="tab" onclick="loadLeaderboard('hard')">Hard</button>
            </div>
            
            <div class="leaderboard" id="leaderboard">
                Loading leaderboard...
            </div>
            
            <a href="/" class="back-button">← Back to Game</a>
        </div>
        
        <script>
            let currentDifficulty = 'all';
            
            async function loadLeaderboard(difficulty = 'all') {
                currentDifficulty = difficulty;
                
                // Update active tab
                document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
                
                try {
                    const response = await fetch(`/api/leaderboard?difficulty=${difficulty}&limit=20`);
                    const data = await response.json();
                    
                    const leaderboard = document.getElementById('leaderboard');
                    if (data.leaderboard.length === 0) {
                        leaderboard.innerHTML = '<p>No scores yet for this difficulty!</p>';
                        return;
                    }
                    
                    leaderboard.innerHTML = data.leaderboard.map(entry => `
                        <div class="score-item">
                            <span class="rank">#${entry.rank}</span>
                            <span class="team-name">${entry.teamName}</span>
                            <span class="landmarks">${entry.landmarksSaved} landmarks</span>
                            <span class="difficulty">${entry.difficulty}</span>
                            <span class="score">${entry.score} pts</span>
                        </div>
                    `).join('');
                } catch (error) {
                    document.getElementById('leaderboard').innerHTML = '<p>Error loading leaderboard</p>';
                }
            }
            
            async function loadStats() {
                try {
                    const response = await fetch('/api/stats');
                    const data = await response.json();
                    
                    document.getElementById('statsContent').innerHTML = `
                        <p><strong>Total Games:</strong> ${data.totalGames}</p>
                        <p><strong>Average Score:</strong> ${data.averageScore}</p>
                        <p><strong>Highest Score:</strong> ${data.highestScore}</p>
                        <p><strong>Total Landmarks Saved:</strong> ${data.totalLandmarksSaved}</p>
                    `;
                } catch (error) {
                    document.getElementById('statsContent').innerHTML = '<p>Error loading stats</p>';
                }
            }
            
            // Load initial data
            loadLeaderboard('all');
            loadStats();
        </script>
    </body>
    </html>
    '''

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run the app
    port = int(os.environ.get('PORT', 8002))
    app.run(host='0.0.0.0', port=port, debug=True)