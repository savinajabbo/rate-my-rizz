from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import whisper
import onnxruntime as ort
import time
import os
import tempfile
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))
from au_feature import compute_aus
from metrics import compute_metrics
from openai_call import interpret_expression

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
print("Loading models...")
whisper_model = whisper.load_model("tiny.en")
emotion_session = ort.InferenceSession("emotion.onnx")
input_name = emotion_session.get_inputs()[0].name
output_name = emotion_session.get_outputs()[0].name
mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(max_num_faces=1, refine_landmarks=True)
print("Models loaded!")

def avg_dict_list(dict_list):
    if not dict_list:
        return {}
    keys = dict_list[0].keys()
    return {
        k: float(np.mean([d[k] for d in dict_list]))
        for k in keys
    }

def process_video(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, None
    
    session_data = {"aus": [], "metrics": [], "timestamps": []}
    start_time = time.time()
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        if frame_count % 5 != 0:
            continue
        
        frame = cv2.flip(frame, 1)
        results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            aus = compute_aus(landmarks, frame.shape[1], frame.shape[0])
            metrics = compute_metrics(landmarks, frame.shape[1], frame.shape[0])
            
            if isinstance(aus, dict) and isinstance(metrics, dict):
                session_data["aus"].append(aus)
                session_data["metrics"].append(metrics)
                session_data["timestamps"].append(time.time() - start_time)
    
    cap.release()
    
    if not session_data["aus"]:
        return None, None
    
    return avg_dict_list(session_data["aus"]), avg_dict_list(session_data["metrics"])

def process_audio(audio_path):
    try:
        result = whisper_model.transcribe(audio_path, fp16=False, without_timestamps=True)
        return result["text"].strip() or "No speech detected."
    except Exception as e:
        return f"Error: {str(e)}"

# Serve static files from web/web directory
static_path = Path(__file__).parent / "web" / "web"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

@app.get("/")
def root():
    index_path = Path(__file__).parent / "web" / "web" / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"status": "Rate My Rizz API is running"}

@app.get("/{path:path}")
def serve_static(path: str):
    file_path = Path(__file__).parent / "web" / "web" / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/process")
async def process(video: UploadFile = File(...), audio: UploadFile = File(...)):
    try:
        # Save files temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as video_temp:
            video_path = video_temp.name
            content = await video.read()
            video_temp.write(content)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as audio_temp:
            audio_path = audio_temp.name
            content = await audio.read()
            audio_temp.write(content)
        
        try:
            transcription = process_audio(audio_path)
            avg_aus, avg_metrics = process_video(video_path)
            
            if avg_aus is None:
                return JSONResponse(
                    status_code=400,
                    content={"error": "No face detected", "transcription": transcription}
                )
            
            analysis = interpret_expression(avg_aus, avg_metrics)
            
            return {
                "transcription": transcription,
                "analysis": analysis,
                "aus": avg_aus,
                "metrics": avg_metrics
            }
        finally:
            try:
                os.unlink(video_path)
                os.unlink(audio_path)
            except:
                pass
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

