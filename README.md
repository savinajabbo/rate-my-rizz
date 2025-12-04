# rate my rizz

Rate my Rizz is a real-time AI that analyzes facial microexpressions, psychological cues, and confidence metrics to generate a “rizz rating” with a Gen-Z style roast <3

Built with **OpenCV**, **MediaPipe**, **ONNX Runtime**, **Whisper**, and the **OpenAI API**, rate my rizz captures a 30-second webcam session, analyzes microexpressions, transcript and tone of voice, and sends the metrics to a prompt-engineered AI model for interpretation.

---

## Features
- Real-time webcam facial landmark tracking
- Microexpression + AU extraction (e.g., AU12 smile, AU07 lid tighten)  
- Confidence index, tension index, symmetry metrics  
- 30-second session recorder  
- Whisper transcription and tone analysis
- One AI call at the end of the session  
- Generates a “rizz profile” + vibe summary  

---

## Tech Stack
- Next.js (was once Python 3.10 with NumPy :( )
- OpenCV  
- MediaPipe FaceMesh  
- ONNX Runtime  
- SoundDevice  
- Whisper  
- OpenAI API  

---

## How It Works
1. Webcam records your face for a fixed duration.  
2. MediaPipe extracts 468 facial landmarks.  
3. The script computes:  
   - Smile intensity (AU12)  
   - Lid tightening (AU07)  
   - Eye openness  
   - Brow symmetry  
   - Mouth openness  
   - Head tilt  
   - Facial tension index  
   - Confidence index  
4. Microphone records audio in parallel.  
5. All data is averaged.  
6. Final metrics are sent to OpenAI for analysis using prompt engineering.  
7. Output = vibe analysis + rizz breakdown.
