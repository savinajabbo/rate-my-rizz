# Quick Deploy Guide

## Fastest Way: Render (5 minutes)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Render.com**
   - Sign up/login
   - Click "New +" → "Web Service"
   - Connect GitHub repo

3. **Configure:**
   - Name: `rate-my-rizz`
   - Build: `pip install -r requirements.txt`
   - Start: `cd web/web && gunicorn --bind 0.0.0.0:$PORT --timeout 300 --workers 1 --threads 2 server:app`

4. **Add Environment Variable:**
   - `OPENAI_API_KEY` = your key

5. **Deploy!** 🚀

Your app will be live at `https://rate-my-rizz.onrender.com` (or your chosen name)

---

## Alternative: Railway (Even Faster)

1. Push to GitHub
2. Go to railway.app
3. New Project → GitHub repo
4. Add `OPENAI_API_KEY` environment variable
5. Deploy!

---

## What You Need

- ✅ GitHub repo with your code
- ✅ OpenAI API key
- ✅ `emotion.onnx` file in project root
- ✅ All files committed (requirements.txt, Procfile, etc.)

---

## First Build Time

- First deployment: **10-15 minutes** (downloads Whisper model)
- Subsequent deployments: **3-5 minutes**

---

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.

