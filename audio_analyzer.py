import librosa
import numpy as np

def analyze_audio(audio_data, sr):
    '''
    audio_data: numpy array of audio samples
    sr: sample rate
    '''
    

    rms = np.sqrt(np.mean(audio_data**2))
    

    pitch, voiced_flag, voiced_probs = librosa.pyin(
        audio_data, 
        fmin=80,
        fmax=300,
        sr=sr
    )
    avg_pitch = np.nanmean(pitch)
    

    centroid = librosa.feature.spectral_centroid(y=audio_data, sr=sr)
    avg_centroid = float(np.mean(centroid))
    
    
    return format_results(rms, avg_pitch, avg_centroid)


def format_results(rms, pitch, centroid):
    '''Format audio analysis results in a simple readable way'''
    

    if rms < 0.05:
        volume = "Quiet"
    elif rms < 0.15:
        volume = "Moderate"
    else:
        volume = "Loud"
    

    if np.isnan(pitch):
        pitch_desc = "No pitch"
    else:
        pitch_desc = f"{pitch:.0f} Hz"
    

    centroid_desc = f"{centroid:.0f} Hz"
    

    
    output = f"""
Volume:   {volume} ({rms:.3f})
Pitch:    {pitch_desc}
Centroid: {centroid_desc}
"""
    
    return output



