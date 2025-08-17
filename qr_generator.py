import qrcode
import os
from PIL import Image, ImageDraw, ImageFont

def create_game_qr_code(url="http://localhost:8002", filename="game_qr_code.png"):
    """
    Create a QR code for the game with custom styling
    """
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Create QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to RGB if needed
    if qr_img.mode != 'RGB':
        qr_img = qr_img.convert('RGB')
    
    # Create a larger image for the QR code with title
    img_width = 400
    img_height = 500
    img = Image.new('RGB', (img_width, img_height), (255, 255, 255))
    
    # Paste QR code in center
    qr_width, qr_height = qr_img.size
    x = (img_width - qr_width) // 2
    y = 80
    img.paste(qr_img, (x, y))
    
    # Add text
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a nice font
        font_title = ImageFont.truetype("arial.ttf", 24)
        font_subtitle = ImageFont.truetype("arial.ttf", 16)
        font_url = ImageFont.truetype("arial.ttf", 12)
    except:
        # Fallback to default font
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_url = ImageFont.load_default()
    
    # Title
    title = "Dr Boogie vs. The Catastrophes of Mikkeli"
    title_bbox = draw.textbbox((0, 0), title, font=font_subtitle)
    title_width = title_bbox[2] - title_bbox[0]
    draw.text(((img_width - title_width) // 2, 20), title, fill="black", font=font_subtitle)
    
    # Subtitle
    subtitle = "🎮 Scan to Play! 🎮"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_title)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    draw.text(((img_width - subtitle_width) // 2, 50), subtitle, fill="black", font=font_title)
    
    # URL at bottom
    url_bbox = draw.textbbox((0, 0), url, font=font_url)
    url_width = url_bbox[2] - url_bbox[0]
    draw.text(((img_width - url_width) // 2, img_height - 40), url, fill="gray", font=font_url)
    
    # Instructions
    instructions = "Play on your mobile device!"
    instructions_bbox = draw.textbbox((0, 0), instructions, font=font_subtitle)
    instructions_width = instructions_bbox[2] - instructions_bbox[0]
    draw.text(((img_width - instructions_width) // 2, img_height - 70), instructions, fill="black", font=font_subtitle)
    
    # Save the image
    img.save(filename)
    print(f"QR code saved as {filename}")
    return filename

def create_hosting_instructions():
    """
    Create a text file with hosting instructions and deployment options
    """
    instructions = """
# Dr Boogie Game - Hosting & QR Code Setup Guide

## Quick Setup Options

### 1. Local Network Access (Immediate)
Your game is currently running at:
- Local: http://localhost:8002
- Network: http://192.168.1.71:8002 (use this for mobile devices on same WiFi)

Share the network IP with mobile devices on the same WiFi network.

### 2. Cloud Hosting (Recommended for Public Access)

#### Option A: Railway (Easy, Free)
1. Push your code to GitHub
2. Go to railway.app
3. Connect your GitHub repository
4. Deploy automatically
5. Get a public URL like: https://your-game-name.up.railway.app

#### Option B: Render (Free)
1. Push your code to GitHub
2. Go to render.com
3. Create new Web Service
4. Connect GitHub repo
5. Use these settings:
   - Build Command: pip install -r requirements.txt
   - Start Command: gunicorn app:app
6. Get URL like: https://your-game-name.onrender.com

#### Option C: Heroku (Free tier ended, but still popular)
1. Install Heroku CLI
2. Run: heroku create your-game-name
3. Run: git push heroku main
4. Get URL like: https://your-game-name.herokuapp.com

#### Option D: Netlify (For frontend-only version)
If you want to use the original Firebase version:
1. Remove app.py and backend files
2. Drag folder to netlify.com
3. Configure Firebase for database

### 3. Custom Domain (Optional)
After deploying to any service above:
1. Buy a domain (e.g., namecheap.com, godaddy.com)
2. Point it to your hosting service
3. Update QR code with your custom domain

## Updating QR Code
1. Deploy your game to chosen hosting service
2. Get the public URL
3. Run this script with your URL:
   python qr_generator.py --url "https://your-actual-url.com"

## Mobile Access Tips
- Make sure mobile devices can access the URL
- Test on different devices and browsers
- For local network: ensure all devices are on same WiFi
- For cloud hosting: URL works anywhere with internet

## Security Notes
- The included SQLite database is for development
- For production, consider PostgreSQL
- Set proper environment variables
- Enable HTTPS for production

## Troubleshooting
- If QR code doesn't work: verify URL is accessible
- If mobile issues: check responsive design
- If database issues: check file permissions
- If deployment fails: check logs in hosting service

Good luck with your game deployment! 🎮
"""
    
    with open("hosting_instructions.txt", "w", encoding="utf-8") as f:
        f.write(instructions)
    print("Hosting instructions saved as hosting_instructions.txt")

if __name__ == "__main__":
    import sys
    
    # Default to localhost for development
    default_url = "http://localhost:8002"
    
    # Check if URL provided as command line argument
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = default_url
        print(f"Using default URL: {url}")
        print("To use a different URL, run: python qr_generator.py 'https://your-hosted-url.com'")
    
    # Create QR code
    filename = create_game_qr_code(url)
    
    # Create hosting instructions
    create_hosting_instructions()
    
    print(f"\n✅ QR Code created: {filename}")
    print("✅ Hosting instructions created: hosting_instructions.txt")
    print(f"\n🎮 Game URL: {url}")
    print("📱 Share the QR code for easy mobile access!")