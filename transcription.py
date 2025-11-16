import whisper
model = whisper.load_model("small")

def transcribe(audio_path):
    result = model.transcribe(audio_path)
    return result["text"]
