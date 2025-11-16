# Rate My Rizz - Next.js Version

A Next.js/TypeScript version of the Rate My Rizz app, deployed on Vercel.

## Features

- ✅ Client-side video recording with MediaPipe Face Mesh
- ✅ Real-time facial analysis (Action Units & Metrics)
- ✅ Audio transcription using OpenAI Whisper API
- ✅ AI-powered rizz analysis using GPT-4
- ✅ Beautiful modern UI with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variable:**
   ```bash
   cp .env.example .env.local
   # Add your OPENAI_API_KEY to .env.local
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial Next.js version"
   git push
   ```

2. **Go to [vercel.com](https://vercel.com)**
   - Sign up/login
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variable: `OPENAI_API_KEY`
   - Deploy!

## Differences from Python Version

- **MediaPipe**: Runs client-side in browser (no server processing needed)
- **Whisper**: Uses OpenAI Whisper API (instead of local model)
- **Face Analysis**: Computed in real-time on client
- **No OpenCV**: Uses MediaPipe for face detection
- **No ONNX**: Emotion detection can be added later if needed

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- MediaPipe Face Mesh
- OpenAI API (Whisper + GPT-4)
- Tailwind CSS

