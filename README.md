# Dr Boogie vs. The Catastrophes of Mikkeli 🎮

A fun browser-based game where players control Dr Boogie to save landmarks in Mikkeli from various disasters!

## Features

- **Interactive Gameplay**: Move Dr Boogie around the map to save landmarks from disasters
- **Power-ups**: Collect freeze and shield power-ups to help protect landmarks
- **Difficulty Levels**: Choose from Easy, Medium, or Hard difficulty
- **Leaderboard**: Compete with other players and track high scores
- **Mobile Friendly**: Responsive design works on desktop and mobile devices

## Game Mechanics

- **Objective**: Save as many landmarks as possible in 60 seconds
- **Scoring**: 
  - Save a landmark: +50 points
  - Block a disaster: +10 points
  - Perfect game (all landmarks saved): +100 bonus
  - Landmark destroyed: -20 points
- **Power-ups**:
  - ❄️ **Freeze**: Stops all disasters for 5 seconds
  - 🛡️ **Shield**: Protects a landmark from one disaster hit

## Setup Instructions

### Local Development

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the game**:
   ```bash
   python app.py
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8002`

### Deployment Options

### GitHub Pages (Static)

This repo includes a workflow to deploy the static front-end to GitHub Pages (backend features like the leaderboard API won’t work on Pages).

Steps:
1. Push your code to GitHub and ensure default branch is `main`.
2. In GitHub: Settings → Pages → Build and deployment → Source: GitHub Actions.
3. The workflow `.github/workflows/deploy.yml` will build and publish the site to Pages on every push to `main`.
4. Your site will be available at `https://<your-username>.github.io/<repo-name>/`.

Note: Assets with spaces in filenames (e.g., `Shield.56 PM`) are handled in the workflow copy step. If you add more assets, update the copy list.

#### Heroku Deployment

1. **Create a Heroku app**:
   ```bash
   heroku create your-game-name
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

3. **Open the app**:
   ```bash
   heroku open
   ```

#### Railway Deployment

1. Connect your GitHub repository to Railway
2. Deploy automatically with zero configuration
3. Railway will detect Python and use the Procfile

#### Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use these build settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

### Environment Variables

The app works out of the box with SQLite database. For production, you may want to configure:

- `PORT`: Port number (default: 8002)
- `DATABASE_URL`: PostgreSQL database URL (if using PostgreSQL instead of SQLite)

## API Endpoints

- `GET /` - Game homepage
- `POST /api/scores` - Save a new score
- `GET /api/scores` - Get all scores
- `GET /api/leaderboard` - Get leaderboard data
- `GET /api/stats` - Get game statistics
- `GET /leaderboard` - Leaderboard webpage

## File Structure

```
├── app.py              # Flask backend server
├── index.html          # Main game page
├── style.css           # Game styling
├── game.js             # Game logic and Phaser.js code
├── ui.js               # UI management and API integration
├── requirements.txt    # Python dependencies
├── Procfile           # Heroku deployment config
├── runtime.txt        # Python version specification
├── assets/            # Game images and assets
└── README.md          # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Phaser.js 3.70.0
- **Backend**: Python Flask with SQLite database
- **Deployment**: Heroku/Railway/Render compatible

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.

---

**Have fun saving Mikkeli! 🏰🛡️**
