from flask import Flask, request, jsonify, send_from_directory
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

sys.path.append(str(Path(__file__).parent.parent.parent))
from au_feature import compute_aus
from metrics import compute_metrics
from openai_call import interpret_expression

app = Flask(__name__, static_folder='.', static_url_path='')

whisper_model = whisper.load_model("tiny.en")
print("whisper model loaded")

emotion_session = ort.InferenceSession(str(Path(__file__).parent.parent.parent / "emotion.onnx"))
input_name = emotion_session.get_inputs()[0].name
output_name = emotion_session.get_outputs()[0].name
EMOTIONS = ["neutral", "happiness", "surprise", "sadness", "anger", "disgust", "fear", "contempt"]
print("emotion model loaded")

mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(max_num_faces=1, refine_landmarks=True)

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
        print(f"could not open video file directly")
        return None, None
    
    session_data = {
        "aus": [],
        "metrics": [],
        "timestamps": [],
    }
    
    start_time = time.time()
    frame_count = 0
    frames_processed = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        if frame_count % 5 != 0:
            continue
        
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        
        results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            aus = compute_aus(landmarks, frame.shape[1], frame.shape[0])
            metrics = compute_metrics(landmarks, frame.shape[1], frame.shape[0])
            
            if isinstance(aus, dict) and isinstance(metrics, dict):
                session_data["aus"].append(aus)
                session_data["metrics"].append(metrics)
                session_data["timestamps"].append(time.time() - start_time)
                frames_processed += 1
    
    cap.release()
    
    if not session_data["aus"]:
        print(f"Warning: No face detected in {frames_processed} processed frames")
        return None, None
    
    avg_aus = avg_dict_list(session_data["aus"])
    avg_metrics = avg_dict_list(session_data["metrics"])
    
    print(f"Processed {frames_processed} frames with face detection")
    return avg_aus, avg_metrics

def process_audio(audio_path):
    try:
        result = whisper_model.transcribe(audio_path, fp16=False, without_timestamps=True)
        transcription = result["text"].strip()
        if not transcription:
            return "No speech detected in audio."
        return transcription
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        import traceback
        traceback.print_exc()
        return f"Error transcribing audio: {str(e)}"

@app.route("/")
def index():
    return send_from_directory('.', 'index.html')

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory('.', path)

@app.route("/process", methods=["POST"])
def process():
    try:
        if 'video' not in request.files or 'audio' not in request.files:
            return jsonify({"error": "Missing video or audio file"}), 400
        
        video_file = request.files['video']
        audio_file = request.files['audio']
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as video_temp:
            video_path = video_temp.name
            video_file.save(video_path)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as audio_temp:
            audio_path = audio_temp.name
            audio_file.save(audio_path)
        
        try:
            print("Transcribing audio...")
            transcription = process_audio(audio_path)
            print(f"Transcription: {transcription}")
            
            avg_aus, avg_metrics = process_video(video_path)
            
            if avg_aus is None or avg_metrics is None:
                return jsonify({
                    "error": "Could not detect face in video. Please ensure your face is visible.",
                    "transcription": transcription
                }), 400
        
            print("Generating analysis...")
            analysis = interpret_expression(avg_aus, avg_metrics)
            
            return jsonify({
                "transcription": transcription,
                "analysis": analysis,
                "aus": avg_aus,
                "metrics": avg_metrics
            })
            
        finally:
            try:
                os.unlink(video_path)
                os.unlink(audio_path)
            except:
                pass
                
    except Exception as e:
        print(f"Error processing request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    print(f"Starting Flask server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
