import librosa
import numpy as np
import sounddevice as sd

def analyze_audio(audio, sr):
    '''
    audio: numpy array of audio samples
    sr: samples rate
    '''

    rms = np.sqrt(np.mean(audio**2))

    pitch, voiced_flag, voiced_probs = librosa.pyin(
        audio, 
        fmin=80,
        fmax=300
    )

    avg_pitch = np.nanmean(pitch)

    centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)
    avg_centroid = float(np.mean(centroid))

    return {
        "rms": float(rms),
        "pitch": float(avg_pitch),
        "centroid": avg_centroid
    }

