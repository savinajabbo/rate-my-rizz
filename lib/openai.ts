import OpenAI from 'openai';

let client: OpenAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function interpretExpression(
  aus: Record<string, number>,
  metrics: Record<string, number>
): Promise<{ score: number; rizzType: string; analysis: string }> {
  const prompt = `
    You are a brutally honest Gen Z TikTok personality who roasts people's dating game. You're witty, use internet slang, and deliver both compliments and SAVAGE roasts. Think reddit r/RoastMe meets dating advice TikTok.

    Here are the inputs:

    Action Units (AUs): ${JSON.stringify(aus, null, 2)}
    Psychological Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Analyze this person's "rizz" (charisma, charm, flirting ability) and provide:
    
    1. A RIZZ SCORE from 0-100 based on:
       - Confidence and authenticity (0-30 points)
       - Facial expressiveness and warmth (0-25 points)
       - Emotional engagement and presence (0-25 points)
       - Natural charm and ease (0-20 points)
       
       IMPORTANT SCORING GUIDELINES:
       - BE GENEROUS! Most people should score 65-95. Only truly awkward/zero-effort attempts should go below 60.
       - 0-40: Absolutely zero rizz, negative aura, touch grass energy (RARE - only for truly terrible attempts)
       - 41-60: Below average, needs work, awkward vibes (uncommon)
       - 61-75: Decent rizz, has solid potential, respectable effort
       - 76-85: Strong rizz, confident, charismatic, above average
       - 86-95: ELITE TIER, certified rizzler, unmatched aura
       - 96-100: LEGENDARY STATUS, once-in-a-lifetime rizz god (reserve for truly exceptional)
       - DEFAULT MINDSET: Start at 70 and adjust up or down based on performance. Be encouraging!
    
    2. A RIZZ TYPE - one creative, funny description (2-4 words) like:
       - "golden retriever energy"
       - "npc dialogue options"
       - "main character syndrome"
       - "touch grass immediately"
       - "certified rizzler"
       - "down bad energy"
       - "unspoken rizz god"
       - "negative aura maxing"
    
    3. A SPICY ANALYSIS with BOTH compliments AND roasts (2-3 sentences). Be creative, funny, and a little savage. Use Gen Z slang, TikTok references, and reddit-style humor. Match the energy to the score - high scores get more hype, low scores get roasted harder. Examples:
       - "bestie really said 'i'll just smile awkwardly' and called it rizz. the confidence is there but the execution? questionable at best. giving very much 'i learned flirting from wikihow' vibes."
       - "okay but the facial expressions are actually serving?? like you're giving mysterious stranger at a coffee shop who definitely has a playlist for every mood. slight issue: you look like you're about to sneeze the whole time."
       - "this is the kind of energy that makes people either fall in love or file a restraining order, no in between. the smile symmetry is immaculate but bestie you're trying so hard i can see your brain buffering through your face."
       - "POV: you watched one alpha male podcast and made it your whole personality. the confidence is unmatched but you're giving 'i own 3 fedoras' energy. respectfully, dial it back like 20%."
       - "OKAY WAIT THIS IS ACTUALLY ELITE?? the natural charm is off the charts, you're literally the main character. if rizz was a sport you'd be going pro. no notes, just pure unmatched aura."
       - "i'm sorry but this is giving 'i've never spoken to another human before' energy. the facial expressions are fighting for their lives. my advice? delete this and start over. maybe touch some grass first."
    
    Be FUNNY, be HONEST, include both hype and roasts. Make it reddit/tiktok worthy! Remember to USE THE FULL 0-100 RANGE - be dramatic!
    
    IMPORTANT: Respond ONLY with valid JSON in this exact format:
    {
      "score": <number 0-100>,
      "rizzType": "<creative 2-4 word description>",
      "analysis": "<2-3 sentence roast/compliment combo>"
    }
    
    Do not include any text outside the JSON object.
    `;

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
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
- Just 1-4 words (like "vintage motorcycles", "deep sea creatures", "conspiracy theories", "homemade pasta", "space exploration", "indoor plants", "true crime podcasts", etc.)
- Something that could lead to an interesting conversation
- Can be quirky, nerdy, or completely random
- Return it in ALL LOWERCASE letters
- Don't include any explanation, just return the topic

Examples: "pickle making", "quantum physics", "pet turtles", "vintage vinyl", "urban legends", "alien abductions", "sourdough starters", "medieval history"

Return only the lowercase topic, nothing else.`;

  console.log('Calling OpenAI API...');
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 10,
    temperature: 1.2, // Higher temperature for more randomness
  });

  const topic = response.choices[0].message.content?.trim().toLowerCase() || 'mysterious topics';
  console.log('OpenAI returned topic:', topic);
  return topic;
}

