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

