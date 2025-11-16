// OpenAI API call (translated from Python)

import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const client = new OpenAI({ apiKey });

export async function interpretExpression(
  aus: Record<string, number>,
  metrics: Record<string, number>
): Promise<string> {
  const prompt = `
    You are a world-class psychologist, behavioral scientist, and microexpression expert. You analyze facial Action Units (AUs), subtle muscle activity, and geometric facial cues to understand emotional state, confidence, social energy, and flirting behavior.

    Here are the inputs:

    Action Units (AUs): ${JSON.stringify(aus, null, 2)}
    Psychological Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Analyze the following clearly and scientifically:
    1. What microexpressions are present?
    2. What emotion or psychological state does this imply?
    3. What level of confidence, anxiety, and social engagement is shown?
    4. What type of social vibe is the person giving (friendly, nervous, intense, playful)?
    5. What "rizz energy" does this match (e.g., soft rizz, sigma rizz, golden-retriever rizz, god-tier rizz, cringe rizz, awkward rizz, etc.)?
    6. Give a human-friendly explanation (1 short paragraph).
    7. Then give a one-sentence fun TikTok and Gen-Z roast or compliment.
    `;

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content || 'Analysis unavailable';
}

export async function generateRandomDateTopic(): Promise<string> {
  const prompt = `Generate a single, random, interesting topic that someone might talk about on a date. It should be:
- Just 1-3 words (like "vintage motorcycles", "deep sea creatures", "conspiracy theories", "homemade pasta", "space exploration", "indoor plants", "true crime podcasts", etc.)
- Something that could lead to an interesting conversation
- Can be quirky, nerdy, or completely random
- Don't include any explanation, just return the topic

Examples: "pickle making", "quantum physics", "pet turtles", "vintage vinyl", "urban legends"

Return only the topic, nothing else.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 10,
    temperature: 1.2, // Higher temperature for more randomness
  });

  return response.choices[0].message.content?.trim() || 'mysterious topics';
}

