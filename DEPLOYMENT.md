# Deployment Guide for Rate My Rizz

This guide will help you deploy your Flask application to a web hosting service.

## Prerequisites

- A GitHub account (for version control)
- An account on a hosting platform (Render, Railway, or Heroku)
- Your OpenAI API key

## Option 1: Deploy to Render (Recommended - Free Tier Available)

### Steps:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a Render account**
   - Go to [render.com](https://render.com) and sign up

3. **Create a new Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

4. **Configure the service:**
   - **Name**: rate-my-rizz (or your preferred name)
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `cd web/web && gunicorn --bind 0.0.0.0:$PORT --timeout 300 --workers 1 --threads 2 server:app`
   - **Root Directory**: Leave empty (or set to project root)

5. **Set Environment Variables:**
   - Go to "Environment" tab
   - Add: `OPENAI_API_KEY` = your OpenAI API key
   - Add: `PORT` = 10000 (Render sets this automatically, but you can specify)

6. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete (first build may take 10-15 minutes)

7. **Access your app**
   - Your app will be available at `https://your-app-name.onrender.com`

### Notes for Render:
- Free tier includes 750 hours/month
- Apps on free tier spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading for production use

---

## Option 2: Deploy to Railway

### Steps:

1. **Push your code to GitHub** (same as above)

2. **Create a Railway account**
   - Go to [railway.app](https://railway.app) and sign up
   - Connect your GitHub account

3. **Create a new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Configure the service:**
   - Railway will auto-detect Python
   - It will use the `Procfile` automatically
   - If needed, set the root directory to project root

5. **Set Environment Variables:**
   - Go to "Variables" tab
   - Add: `OPENAI_API_KEY` = your OpenAI API key

6. **Deploy**
   - Railway will automatically deploy
   - First build may take 10-15 minutes

7. **Access your app**
   - Railway provides a URL like `https://your-app-name.up.railway.app`

### Notes for Railway:
- Free tier includes $5 credit/month
- Pay-as-you-go pricing after free tier
- No automatic spin-down

---

## Option 3: Deploy to Heroku

### Steps:

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a Heroku app**
   ```bash
   heroku create your-app-name
   ```

4. **Set environment variables**
   ```bash
   heroku config:set OPENAI_API_KEY=your-api-key-here
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Open your app**
   ```bash
   heroku open
   ```

### Notes for Heroku:
- No longer has a free tier
- Paid plans start at $5/month
- Very reliable and well-documented

---

## Important Files for Deployment

- `requirements.txt` - Python dependencies
- `Procfile` - Tells the platform how to run your app
- `runtime.txt` - Python version (optional, for Heroku)
- `web/web/server.py` - Your Flask application
- `emotion.onnx` - Emotion detection model (must be in project root)
- `render.yaml` - Render configuration (optional, for Render)

## Environment Variables

Make sure to set these in your hosting platform:

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PORT` - Usually set automatically by the platform
- `FLASK_ENV` - Set to "production" for production (optional)

## Troubleshooting

### Build fails with "opencv-python" error
- Some platforms have issues with opencv-python. Try using `opencv-python-headless` instead:
  ```bash
  pip install opencv-python-headless
  ```

### Whisper model download fails
- The first run downloads the Whisper model. Make sure your build has enough time (10-15 minutes).
- If it fails, you may need to pre-download the model and include it in your repo.

### Missing emotion.onnx file
- Make sure `emotion.onnx` is in your project root directory (same level as `requirements.txt`)
- The file should be committed to your repository
- If the file is large, some platforms may have file size limits - check your platform's limits

### Memory issues
- Whisper and MediaPipe can be memory-intensive. Consider:
  - Using a smaller Whisper model (already using "tiny.en")
  - Reducing workers in gunicorn (already set to 1)
  - Upgrading to a plan with more RAM

### Timeout errors
- Processing can take time. The timeout is set to 300 seconds (5 minutes).
- If videos are very long, consider adding a maximum duration limit.

## Security Notes

⚠️ **IMPORTANT**: Never commit your API keys to GitHub!
- The `openai_call.py` file has a fallback key, but you should use environment variables in production
- Add `.env` to your `.gitignore` if you create one
- Always use environment variables for sensitive data

## Custom Domain

Most platforms allow you to add a custom domain:
- **Render**: Settings → Custom Domain
- **Railway**: Settings → Domains
- **Heroku**: Settings → Domains

## Monitoring

Consider adding:
- Error tracking (Sentry, Rollbar)
- Logging service (Papertrail, Logtail)
- Uptime monitoring (UptimeRobot)

---

## Quick Start Checklist

- [ ] Code pushed to GitHub
- [ ] `requirements.txt` created
- [ ] `Procfile` created
- [ ] Environment variables set (OPENAI_API_KEY)
- [ ] First deployment successful
- [ ] Test recording and processing
- [ ] Custom domain configured (optional)

Good luck with your deployment! 🚀

