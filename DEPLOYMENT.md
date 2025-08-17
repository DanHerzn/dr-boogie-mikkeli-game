# 🚀 Dr Boogie Game - Deployment Guide

## Quick Start (Choose One Method)

### Method 1: Railway (Easiest - Free)
1. Create GitHub repository (see GitHub setup below)
2. Go to https://railway.app
3. Sign up with GitHub
4. Click "New Project" → "Deploy from GitHub repo"
5. Select your repository → Done! 🎉

### Method 2: Render (Free Tier)
1. Create GitHub repository (see GitHub setup below)  
2. Go to https://render.com
3. Sign up with GitHub
4. Click "New" → "Web Service"
5. Connect your repository
6. Build Command: `pip install -r requirements.txt`
7. Start Command: `gunicorn app:app`
8. Deploy! 🎉

### Method 3: Heroku (Paid but Reliable)
1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`
3. Create app: `heroku create your-game-name`
4. Push: `git push heroku main`
5. Open: `heroku open`

---

## 📁 GitHub Setup (Required for Railway/Render)

### Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click "+" → "New repository"
3. Name: `dr-boogie-game` (or any name)
4. Make it Public
5. Don't initialize with README (we already have files)
6. Click "Create repository"

### Step 2: Push Your Code
```bash
# In your game folder, run these commands:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub details.

---

## 🔧 Environment Variables (If Needed)

Most platforms will work with default settings, but you can configure:
- `PORT`: Will be set automatically by hosting platforms
- `DATABASE_URL`: SQLite works by default, PostgreSQL for production

---

## 📱 After Deployment

1. **Test your game** at the provided URL
2. **Update QR code** with the new live URL:
   ```bash
   python qr_generator.py 'https://your-live-url.com'
   ```
3. **Share the QR code** for mobile access!

---

## 🆘 Troubleshooting

### Common Issues:
- **Build fails**: Check that `requirements.txt` and `Procfile` exist
- **App won't start**: Verify the start command is `gunicorn app:app`
- **Database errors**: SQLite should work automatically
- **Assets not loading**: Ensure all image files are committed to Git

### Logs:
- **Railway**: Check the "Deployments" tab for logs
- **Render**: Check the "Logs" section
- **Heroku**: Run `heroku logs --tail`

---

## 🎮 Game Features After Deployment

✅ **Live leaderboard** with persistent scores  
✅ **Mobile-optimized** gameplay  
✅ **QR code access** for easy sharing  
✅ **Multiple difficulty levels**  
✅ **Power-up systems** (freeze & shield)  
✅ **Real-time statistics**  

Your game will be accessible worldwide! 🌍

---

**Good luck with your deployment! 🚀**