# Render.com Deployment Instructions

## The Issue
Render tried to deploy your app as a static site instead of a web service, which is why it failed looking for a "build" directory.

## Correct Deployment Steps for Render:

### 1. Go to Render Dashboard
- Visit https://render.com
- Sign in with your GitHub account

### 2. Create a NEW Web Service (NOT Static Site)
- Click "New +" button
- Select "Web Service" (NOT Static Site)
- Connect your GitHub repository: `DanHerzn/dr-boogie-mikkeli-game`

### 3. Configure the Web Service
**Important Settings:**
- **Name**: `dr-boogie-mikkeli-game`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
- **Instance Type**: `Free`

### 4. Advanced Settings (Optional)
- **Python Version**: `3.13.4` (or leave default)
- **Auto-Deploy**: `Yes` (recommended)

### 5. Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for deployment

## Alternative: Try Railway (Easier)

Railway is often easier for Flask apps:

1. Go to https://railway.app
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select `DanHerzn/dr-boogie-mikkeli-game`
5. Railway auto-detects Flask and deploys!

## Your App Will Be Available At:
- Render: `https://dr-boogie-mikkeli-game.onrender.com`
- Railway: `https://dr-boogie-mikkeli-game-production.up.railway.app`

## After Deployment Success:
Send me the live URL and I'll generate a new QR code!