# Integration Guide

## Setup Steps

### 1. Start the Python API Server

```bash
cd ethnicity-api
./start.sh
```

Or manually:
```bash
cd ethnicity-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API will run on `http://localhost:5001`

### 2. Configure Environment Variable (Optional)

Add to your `.env.local` file:
```
ETHNICITY_API_URL=http://localhost:5001
```

### 3. Use in Your Next.js App

Example integration in `app/page.tsx`:

```typescript
import { analyzeEthnicity } from '@/lib/ethnicity';

// In your recording/processing function:
const ethnicityResult = await analyzeEthnicity(videoRef.current, canvasRef.current);

if (ethnicityResult.success && ethnicityResult.ethnicity) {
  console.log('Dominant ethnicity:', ethnicityResult.ethnicity.dominant);
  console.log('Confidence:', ethnicityResult.ethnicity.confidence);
  console.log('All predictions:', ethnicityResult.ethnicity.predictions);
}
```

### 4. Pass to AI Analysis

You can pass ethnicity data to your OpenAI analysis:

```typescript
// In stopRecording or similar function
const ethnicityData = await analyzeEthnicity(videoRef.current, canvasRef.current);

// Add to formData when sending to /api/process
formData.append('ethnicity', JSON.stringify(ethnicityData));
```

## API Response Format

```json
{
  "success": true,
  "ethnicity": {
    "dominant": "asian",
    "predictions": {
      "asian": 0.45,
      "indian": 0.30,
      "middle eastern": 0.15,
      "latino hispanic": 0.05,
      "black": 0.03,
      "white": 0.02
    },
    "confidence": 0.45
  }
}
```

## Notes

- DeepFace models are downloaded on first run (~500MB)
- Processing takes 1-3 seconds per image
- The API handles face detection failures gracefully
- CORS is enabled for localhost development

