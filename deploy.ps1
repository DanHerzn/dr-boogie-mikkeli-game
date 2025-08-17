# PowerShell Deployment Script for Dr Boogie Game

Write-Host "🎮 Dr Boogie Game Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check current directory
$currentDir = Get-Location
Write-Host "📁 Current directory: $currentDir" -ForegroundColor Yellow

# Verify game files exist
$requiredFiles = @("index.html", "style.css", "game.js", "ui.js")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files: $($missingFiles -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required game files found!" -ForegroundColor Green

# Show deployment options
Write-Host "`n🚀 Choose your deployment method:" -ForegroundColor Cyan
Write-Host "1. GitHub Pages (Recommended - Free)" -ForegroundColor White
Write-Host "2. Netlify (Easy drag & drop)" -ForegroundColor White
Write-Host "3. Vercel (Fast deployment)" -ForegroundColor White
Write-Host "4. Firebase Hosting (Google)" -ForegroundColor White
Write-Host "5. Start local server for testing" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n📚 GitHub Pages Deployment:" -ForegroundColor Cyan
        Write-Host "1. Create a new repository on GitHub" -ForegroundColor White
        Write-Host "2. Push these files to the repository:" -ForegroundColor White
        
        if (Test-Command "git") {
            Write-Host "`nInitializing Git repository..." -ForegroundColor Yellow
            git init
            git add .
            git commit -m "Initial commit: Dr Boogie game"
            Write-Host "✅ Git repository initialized!" -ForegroundColor Green
            Write-Host "`nNext steps:" -ForegroundColor Cyan
            Write-Host "1. Create a repository on GitHub" -ForegroundColor White
            Write-Host "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Yellow
            Write-Host "3. Run: git push -u origin main" -ForegroundColor Yellow
            Write-Host "4. Enable GitHub Pages in repository settings" -ForegroundColor White
        } else {
            Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
            Write-Host "Download from: https://git-scm.com/download/win" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host "`n🌐 Netlify Deployment:" -ForegroundColor Cyan
        Write-Host "1. Go to https://netlify.com" -ForegroundColor White
        Write-Host "2. Sign up/login" -ForegroundColor White
        Write-Host "3. Drag and drop this entire folder to Netlify" -ForegroundColor White
        Write-Host "4. Your game will be live instantly!" -ForegroundColor Green
        Write-Host "`n📝 netlify.toml configuration file created for optimal deployment" -ForegroundColor Yellow
    }
    
    "3" {
        Write-Host "`n⚡ Vercel Deployment:" -ForegroundColor Cyan
        
        if (Test-Command "npm") {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
            Write-Host "Starting Vercel deployment..." -ForegroundColor Yellow
            vercel
        } else {
            Write-Host "1. Go to https://vercel.com" -ForegroundColor White
            Write-Host "2. Sign up/login" -ForegroundColor White
            Write-Host "3. Import this project from GitHub or drag & drop" -ForegroundColor White
            Write-Host "4. Deploy instantly!" -ForegroundColor Green
            Write-Host "`n📝 vercel.json configuration file created" -ForegroundColor Yellow
        }
    }
    
    "4" {
        Write-Host "`n🔥 Firebase Hosting:" -ForegroundColor Cyan
        
        if (Test-Command "npm") {
            Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
            npm install -g firebase-tools
            Write-Host "Starting Firebase setup..." -ForegroundColor Yellow
            Write-Host "1. Run 'firebase login' to authenticate" -ForegroundColor White
            Write-Host "2. Run 'firebase init hosting' to setup" -ForegroundColor White
            Write-Host "3. Run 'firebase deploy' to deploy" -ForegroundColor White
        } else {
            Write-Host "❌ npm not found. Please install Node.js first." -ForegroundColor Red
            Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
        }
    }
    
    "5" {
        Write-Host "`n🖥️ Starting local server..." -ForegroundColor Cyan
        
        if (Test-Command "python") {
            Write-Host "Starting Python HTTP server on port 8000..." -ForegroundColor Yellow
            Write-Host "🌐 Game will be available at: http://localhost:8000" -ForegroundColor Green
            Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
            python -m http.server 8000
        } elseif (Test-Command "node") {
            Write-Host "Starting Node.js server..." -ForegroundColor Yellow
            $serverScript = @"
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: '+error.code+' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log('🌐 Server running at http://localhost:' + PORT + '/');
    console.log('Press Ctrl+C to stop');
});
"@
            $serverScript | Out-File -FilePath "server.js" -Encoding UTF8
            node server.js
        } else {
            Write-Host "❌ Neither Python nor Node.js found." -ForegroundColor Red
            Write-Host "Please install Python (https://python.org) or Node.js (https://nodejs.org)" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host "`n🎮 Deployment script completed!" -ForegroundColor Green
Write-Host "📖 Check README.md for detailed instructions" -ForegroundColor Yellow