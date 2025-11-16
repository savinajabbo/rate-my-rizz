from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv(".env.local")
API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=API_KEY)

def interpret_expression(aus, metrics):
    prompt = f"""
    You are a world-class psychologist, behavioral scientist, and microexpression expert. You analyze facial Action Units (AUs), subtle muscle activity, and geometric facial cues to understand emotional state, confidence, social energy, and fliriting behavior.

    Here are the inputs:

    Action Units (AUs): {json.dumps(aus, indent=2)}
    Psychological Metrics: {json.dumps(metrics, indent=2)}
    
    Analyze the following clearly and scientifically:
    1. What microexpressions are present?
    2. What emotion or psychological state does this imply?
    3. What level of confidence, anciety, and social engagement is shown?
    4. What type of social vibe is the person giving (friendly, nervous, intense, playful)?
    5. What "rizz energy" does this match (e.g., soft rizz, sigma rizz, golden-retriever rizz, god-tier rizz, cringe rizz, awkward rizz, etc.)?
    6. Give a human-friendly explanation (1 short paragraph).
    7. Then give a one-sentence fun Tiktok and Gen-Z roast or compliment.
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content