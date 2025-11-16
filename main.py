import cv2
import onnxruntime as ort
import librosa
import numpy as np
import sounddevice as sd
import mediapipe as mp
import threading
pending = False
lock = threading.Lock()

import wave
import whisper
from openai_call import interpret_expression
from metrics import compute_metrics
import time
last_interpret_time = 0
interpretation_text = "..."

from au_feature import compute_aus
#from audio_analyzer import analyze_audio, format_results
sd.default.device = (2, None) 

session_data = {
    "aus": [],
    "metrics": [],
    "timestamps": [],
}

SESSION_DURATION = 10
AUDIO_FILENAME = "temp_audio.wav"
sr = 48000
channels = 1

def record_audio_blocking(duration):
    print("Recording audio...")
    audio = sd.rec(int(duration * sr), samplerate=sr, channels=channels)
    sd.wait()
    print("Audio recording complete.")
    audio_int16 = (audio.flatten() * 32767).astype(np.int16)

    with wave.open(AUDIO_FILENAME, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio_int16.tobytes())
    
    print(f"Audio saved to {AUDIO_FILENAME}")
    return audio

start_time = time.time()

audio_thread = threading.Thread(target=record_audio_blocking, args=(SESSION_DURATION,), daemon=False)
audio_thread.start()

mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(max_num_faces=1, refine_landmarks=True)
stream = cv2.VideoCapture(0)
stream.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
stream.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# install librosa:
# pip install librosa sounddevice numpy opencv-python

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


stream = cv2.VideoCapture(0)
mp_face = mp.solutions.face_mesh


if not stream.isOpened():
    print("could not access webcam")
    exit()

# ONNX emotion detection
emotion_session = ort.InferenceSession("emotion.onnx")
input_name = emotion_session.get_inputs()[0].name
output_name = emotion_session.get_outputs()[0].name

EMOTIONS = ["neutral", "happiness", "surprise", "sadness", "anger", "disgust", "fear", "contempt"]

def get_emotion(face_bgr):
    img = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (260, 260)).astype("float32")
    img = img / 255.0

    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, axis=0)
    pred = emotion_session.run([output_name], {input_name: img})[0].flatten()
    idx = np.argmax(pred)
    return EMOTIONS[idx], float(pred[idx])

def eyebrow_raise(landmarks, w, h):
    brow_y = landmarks[70].y*h
    eye_y = landmarks[145].y*h
    return eye_y -brow_y

def interpret_worker(aus, metrics):
    global pending, interpretation_text
    result = interpret_expression(aus, metrics)
    with lock:
        interpretation_text = result
    pending = False

# def record_audio():
#     global audio_recording, audio_done
#     audio_recording = sd.rec(int(duration * sr), samplerate=sr, channels=1)
#     sd.wait()
#     with wave.open(AUDIO_FILENAME, "wb") as wf:
#         wf.setnchannels(1)
#         wf.setsampwidth(2)
#         wf.setframerate(sr)
#         wf.writeframes((audio_recording.flatten() * 32767).astype(np.int16).tobytes())
#     audio_done = True
# audio_recording = None
# audio_done = False
# threading.Thread(target=record_audio, daemon=True).start()

face_mesh = mp_face.FaceMesh(
    max_num_faces = 1,
    refine_landmarks = True
)


frame_count = 0
while True:
    ret, frame = stream.read()
    if not ret:
        print("no more stream")
        break
    if time.time() - start_time > SESSION_DURATION:
        print("session complete")
        break

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

        cv2.putText(
            frame,
            f"AU12 (smile): {aus['AU12']:.2f}",
            (10, 170),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )
 
    cv2.imshow("webcam", frame)
    if cv2.waitKey(1) == ord('q'):
        break

audio_thread.join()

print("[WHISPER] Transcribing audio...")
model = whisper.load_model("tiny.en")
result = model.transcribe(AUDIO_FILENAME, fp16=False, without_timestamps=True)
transcribed_text = result["text"]
print("\n[TRANSCRIPTION]")
print(transcribed_text)
print("---------------------------------\n")

def avg_dict_list(dict_list):
    if not dict_list:
        return {}
    keys = dict_list[0].keys()
    return {
        k: float(np.mean([d[k] for d in dict_list]))
        for k in keys
    }

avg_aus = avg_dict_list(session_data["aus"])
avg_metrics = avg_dict_list(session_data["metrics"])

report = interpret_expression(avg_aus, avg_metrics)
print(report)

stream.release()
cv2.destroyAllWindows()
cv2.waitKey(200)

