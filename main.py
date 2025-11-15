import cv2
# from deepface import DeepFace
import onnxruntime as ort
import librosa
import numpy as np
import sounddevice as sd
import mediapipe as mp
from audio_analyzer import analyze_audio

# install librosa:
# pip install librosa sounddevice numpy opencv-python

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

stream = cv2.VideoCapture(0)
mp_face = mp.solutions.face_mesh

duration = 30
sr = 44100


if not stream.isOpened():
    print("could not access webcam")
    exit()

# ONNX emotion detection
emotion_session = ort.InferenceSession("emotion.onnx")
input_name = emotion_session.get_inputs()[0].name
output_name = emotion_session.get_outputs()[0].name

EMOTIONS = ["neutral", "happiness", "surprise", "sadness", "anger", "disgust", "fear", "contempt"]

def get_emotion(face_gray):
    img = cv2.resize(face_gray, (64, 64))
    img = img.astype("float32")
    img = img[np.newaxis, np.newaxis, :, :]
    pred = emotion.session.run([output_name], {input_name: img})[0].flatten()
    idx = no.argmax(pred)
    return EMOTIONS[idx], float(pred[idx])

def eyebrow_raise(landmarks, w, h):
    brow_y = landmarks[70].y*h
    eye_y = landmarks[145].y*h
    return eye_y -brow_y

while True:
    ret, frame = stream.read()
    if not ret:
        print("no more stream")
        break
    
    audio_recording = sd.rec(int(duration * sr), samplerate=sr, channels = 1)
    sd.wait()
    
    with mp_face.FaceMesh(
        max_num_faces = 1,
        refine_landmarks = True
    ) as face_mesh:
        results = face_mesh.process(frame)
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark

            brow = landmarks[70].y
            eye = landmarks[145].y
            eyebrow_distance = eye - brow
            print("Eyebrow distance: ", eyebrow_distance)

            cv2.putText(
                frame,
                f"brow_dist: {eyebrow_distance}",
                (10,80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 255),
                2
            )

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.3,
        minNeighbors=5,
        minSize=(60, 60)
    )

    for(x, y, w, h) in faces:
        cv2.rectangle(frame, (x,y), (x+w, y+h), (0, 255, 0), 2)
        
    cv2.imshow("webcam", frame)
    if cv2.waitKey(1) == ord('q'):
        break
 
    audio_data = analyze_audio(audio_recording, sr)

    cv2.putText(
        frame,
        (30, 40),
        
    )
    


stream.release()
cv2.destroyAllWindows()