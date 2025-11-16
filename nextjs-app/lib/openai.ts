import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const client = new OpenAI({ apiKey });

export async function interpretExpression(
  aus: Record<string, number>,
  metrics: Record<string, number>
): Promise<{ score: number; rizzType: string; analysis: string }> {
  const prompt = `
    You are a world-class psychologist, behavioral scientist, and microexpression expert. You analyze facial Action Units (AUs), subtle muscle activity, and geometric facial cues to understand emotional state, confidence, social energy, and flirting behavior.

    Here are the inputs:

    Action Units (AUs): ${JSON.stringify(aus, null, 2)}
    Psychological Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Analyze this person's "rizz" (charisma, charm, flirting ability) and provide:
    
    1. A RIZZ SCORE from 0-100 based on:
       - Confidence and authenticity (0-30 points)
       - Facial expressiveness and warmth (0-25 points)
       - Emotional engagement and presence (0-25 points)
       - Natural charm and ease (0-20 points)
    
    2. A RIZZ TYPE - one creative, fun description (2-4 words) like:
       - "golden retriever energy"
       - "mysterious dark academia"
       - "chaotic wholesome vibes"
       - "confident smooth operator"
       - "shy bookworm charm"
       - "playful mischief maker"
       (Be creative and specific to their expressions!)
    
    3. A brief ANALYSIS explaining their score and what makes their rizz unique (2-3 sentences max).
    
    IMPORTANT: Respond ONLY with valid JSON in this exact format:
    {
      "score": <number 0-100>,
      "rizzType": "<creative 2-4 word description>",
      "analysis": "<2-3 sentence explanation>"
    }
    
    Do not include any text outside the JSON object.
    `;

  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || '{"score": 50, "rizzType": "mysterious vibes", "analysis": "Analysis unavailable"}';
  
  try {
    const parsed = JSON.parse(content);
    return {
      score: parsed.score || 50,
      rizzType: parsed.rizzType || 'mysterious vibes',
      analysis: parsed.analysis || 'Analysis unavailable'
    };
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    return {
      score: 50,
      rizzType: 'mysterious vibes',
      analysis: 'Analysis unavailable'
    };
  }
}

export async function generateRandomDateTopic(): Promise<string> {
  console.log('generateRandomDateTopic called');
  const prompt = `Generate a single, random, interesting topic that someone might talk about on a date. It should be:
- Just 1-3 words (like "vintage motorcycles", "deep sea creatures", "conspiracy theories", "homemade pasta", "space exploration", "indoor plants", "true crime podcasts", etc.)
- Something that could lead to an interesting conversation
- Can be quirky, nerdy, or completely random
- Don't include any explanation, just return the topic

Examples: "pickle making", "quantum physics", "pet turtles", "vintage vinyl", "urban legends"

Return only the topic, nothing else.`;

  console.log('Calling OpenAI API...');
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 10,
    temperature: 1.2, // Higher temperature for more randomness
  });

  const topic = response.choices[0].message.content?.trim() || 'mysterious topics';
  console.log('OpenAI returned topic:', topic);
  return topic;
}

