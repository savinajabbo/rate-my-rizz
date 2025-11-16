import cv2
import onnxruntime as ort
import librosa
import numpy as np
import sounddevice as sd
import mediapipe as mp
# import soundfile as sf 
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

AUDIO_FILENAME = "temp_audio.wav"
duration = 30
sr = 16000



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

def record_audio():
    global audio_recording, audio_done
    audio_recording = sd.rec(int(duration * sr), samplerate=sr, channels=1)
    sd.wait()
    with wave.open(AUDIO_FILENAME, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes((audio_recording.flatten() * 32767).astype(np.int16).tobytes())
    audio_done = True
audio_recording = None
audio_done = False
threading.Thread(target=record_audio, daemon=True).start()

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

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    
    results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    if results.multi_face_landmarks:
        landmarks = results.multi_face_landmarks[0].landmark
        aus = compute_aus(landmarks, w, h)

        metrics = compute_metrics(landmarks, w, h)

        if not pending and time.time() - last_interpret_time > 2:
            pending = True
            threading.Thread(
                target=interpret_worker,
                args=(aus, metrics),
                daemon=True
            ).start()
            last_interpret_time = time.time()

        # y0 = 200
        # dy = 22

        # for i, line in enumerate(interpretation_text.split('\n')):
        #     y = y0 + i*dy
        #     cv2.putText(
        #         frame,
        #         line,
        #         (10, y),
        #         cv2.FONT_HERSHEY_SIMPLEX,
        #         0.55,
        #         (0, 255, 0),
        #         1,
        #         cv2.LINE_AA
        #     )
        if time.time() - last_interpret_time < 0.2:
            print(interpretation_text)

        cv2.putText(
            frame,
            f"AU12 (smile): {aus['AU12']:.2f}",
            (10, 170),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"AU07 (lid tighteb): {aus['AU07']:.2f}",
            (10, 200),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )
        

        brow = eyebrow_raise(landmarks, w, h)
        #smile = smile_intensity(landmarks, w, h)
        #eyes = eye_openness(landmarks, w, h)

        cv2.putText(
            frame,
            f"Eyebrow: {brow:.3f}",
            (10, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

        x1, y1 = int(landmarks[1].x * w), int(landmarks[1].y * h)
        x2, y2 = int(landmarks[152].x * w), int(landmarks[152].y * h)

        x1, x2 = min(x1, x2), max(x1, x2)
        y1, y2 = min(y1, y2), max(y1, y2)

        face_crop = frame[y1:y2, x1:x2]

        # if face_crop.size > 0:
        #     au12 = aus.get("AU12", 0.0)

        #     cv2.putText(
        #         frame,
        #         f"AU12: {au12:.2f}",
        #         (10, 170),
        #         cv2.FONT_HERSHEY_SIMPLEX,
        #         0.7,
        #         (0, 255, 0),
        #         2
        #     )

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5,
        minSize=(60, 60)
    )

    # for(x, y, w, h) in faces:
    #     cv2.rectangle(frame, (x,y), (x+w, y+h), (0, 255, 0), 2)
        
    cv2.imshow("webcam", frame)
    if cv2.waitKey(1) == ord('q'):
        break
 
    # audio_data = analyze_audio(audio_recording, sr)

    # cv2.putText(
    #     frame,
    #     (30, 40),
    #     cv2.FONT_HERSHEY_SIMPLEX,
    #     1, 
    #     (0, 255, 0),
    #     2
    # )
# model = whisper.load_model("tiny")
# result = model.transcribe(AUDIO_FILENAME, fp16=False, without_timestamps=True)


stream.release()
cv2.destroyAllWindows()

