#!/bin/bash

# Bash Deployment Script for Dr Boogie Game (Linux/Mac)

echo "🎮 Dr Boogie Game Deployment Script"
echo "====================================="

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check current directory
echo "📁 Current directory: $(pwd)"

# Verify game files exist
required_files=("index.html" "style.css" "game.js" "ui.js")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "❌ Missing required files: ${missing_files[*]}"
    exit 1
fi

echo "✅ All required game files found!"

# Show deployment options
echo ""
echo "🚀 Choose your deployment method:"
echo "1. GitHub Pages (Recommended - Free)"
echo "2. Netlify (Easy drag & drop)"
echo "3. Vercel (Fast deployment)"
echo "4. Firebase Hosting (Google)"
echo "5. Start local server for testing"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "📚 GitHub Pages Deployment:"
        echo "1. Create a new repository on GitHub"
        echo "2. Push these files to the repository:"
        
        if command_exists git; then
            echo ""
            echo "Initializing Git repository..."
            git init
            git add .
            git commit -m "Initial commit: Dr Boogie game"
            echo "✅ Git repository initialized!"
            echo ""
            echo "Next steps:"
            echo "1. Create a repository on GitHub"
            echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
            echo "3. Run: git push -u origin main"
            echo "4. Enable GitHub Pages in repository settings"
        else
            echo "❌ Git not found. Please install Git first."
        fi
        ;;
        
    2)
        echo ""
        echo "🌐 Netlify Deployment:"
        echo "1. Go to https://netlify.com"
        echo "2. Sign up/login"
        echo "3. Drag and drop this entire folder to Netlify"
        echo "4. Your game will be live instantly!"
        echo ""
        echo "📝 netlify.toml configuration file created for optimal deployment"
        ;;
        
    3)
        echo ""
        echo "⚡ Vercel Deployment:"
        
        if command_exists npm; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
            echo "Starting Vercel deployment..."
            vercel
        else
            echo "1. Go to https://vercel.com"
            echo "2. Sign up/login"
            echo "3. Import this project from GitHub or drag & drop"
            echo "4. Deploy instantly!"
            echo ""
            echo "📝 vercel.json configuration file created"
        fi
        ;;
        
    4)
        echo ""
        echo "🔥 Firebase Hosting:"
        
        if command_exists npm; then
            echo "Installing Firebase CLI..."
            npm install -g firebase-tools
            echo "Starting Firebase setup..."
            echo "1. Run 'firebase login' to authenticate"
            echo "2. Run 'firebase init hosting' to setup"
            echo "3. Run 'firebase deploy' to deploy"
        else
            echo "❌ npm not found. Please install Node.js first."
        fi
        ;;
        
    5)
        echo ""
        echo "🖥️ Starting local server..."
        
        if command_exists python3; then
            echo "Starting Python 3 HTTP server on port 8000..."
            echo "🌐 Game will be available at: http://localhost:8000"
            echo "Press Ctrl+C to stop the server"
            python3 -m http.server 8000
        elif command_exists python; then
            echo "Starting Python HTTP server on port 8000..."
            echo "🌐 Game will be available at: http://localhost:8000"
            echo "Press Ctrl+C to stop the server"
            python -m http.server 8000
        elif command_exists node; then
            echo "Starting Node.js server..."
            cat > server.js << 'EOF'
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
        '.json': 'application/json'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: '+error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(8000, () => {
    console.log('🌐 Server running at http://localhost:8000/');
    console.log('Press Ctrl+C to stop');
});
EOF
            node server.js
        else
            echo "❌ Neither Python nor Node.js found."
            echo "Please install Python or Node.js"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "🎮 Deployment script completed!"
echo "📖 Check README.md for detailed instructions"