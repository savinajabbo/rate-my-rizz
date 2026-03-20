# Ethnicity Detection API

A Flask-based API service for ethnicity detection using DeepFace.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the API:
```bash
python app.py
```

The API will run on `http://localhost:5001`

## Endpoints

### GET /health
Health check endpoint.

### POST /analyze-ethnicity
Analyze ethnicity from a base64-encoded image.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
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

### POST /analyze-all-attributes
Analyze all face attributes (age, gender, race, emotion).

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "ethnicity": {
    "dominant": "asian",
    "predictions": {...},
    "confidence": 0.45
  },
  "age": 28,
  "gender": "Man",
  "emotion": "happy"
}
```

## Integration with Next.js

The API can be called from your Next.js frontend:

```typescript
const response = await fetch('http://localhost:5001/analyze-ethnicity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64ImageData })
});
```

## Notes

- DeepFace will download models on first run (may take a few minutes)
- Models are cached locally after first download
- The API uses temporary files for processing (cleaned up automatically)
- Set `enforce_detection=False` to handle cases where face detection is uncertain

