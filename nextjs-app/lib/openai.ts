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
    BE BRUTALLY HONEST..
    Here are the inputs:

    Action Units (AUs): ${JSON.stringify(aus, null, 2)}
    Psychological Metrics: ${JSON.stringify(metrics, null, 2)}
    
    Analyze this person's "rizz" (charisma, charm, flirting ability) by CAREFULLY examining the metrics:
    - High AU12 (smile) + AU06 (cheek raise) = genuine warmth (GOOD)
    - High tension_index = nervous/stiff (BAD)
    - High confidence_index = natural ease (GOOD)
    - Low eye_openness = disengaged (BAD)
    - Good smile_symmetry = authentic expression (GOOD)
    
    Now provide:
    
    1. A RIZZ SCORE from 0-100 based on:
       - Confidence and authenticity (0-30 points)
       - Facial expressiveness and warmth (0-25 points)
       - Emotional engagement and presence (0-25 points)
       - Natural charm and ease (0-20 points)
       
       CRITICAL SCORING GUIDELINES - USE THE FULL RANGE:
       - 0-20: ZERO RIZZ. Negative aura, cringe energy, absolutely no game whatsoever
       - 21-40: Very weak rizz, awkward, uncomfortable to watch, needs serious help
       - 41-55: Below average, trying but failing, some potential but rough execution
       - 56-70: Average rizz, decent effort, nothing special but not terrible either
       - 71-80: Good rizz, confident, engaging, above average performance
       - 81-90: Excellent rizz, charismatic, natural charm, impressive skills
       - 91-100: ELITE/LEGENDARY, once-in-a-lifetime, absolute rizz god status
       
       IMPORTANT: Analyze the actual data critically. Low confidence/tension = lower scores. High engagement/warmth = higher scores. DON'T default to 70-80 for everyone. Be HONEST and VARIED in your scoring!
    
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

const FALLBACK_TOPICS = [
  'vintage motorcycles', 'deep sea creatures', 'conspiracy theories', 'homemade pasta',
  'space exploration', 'indoor plants', 'true crime podcasts', 'pickle making',
  'quantum physics', 'pet turtles', 'vintage vinyl', 'urban legends',
  'alien abductions', 'sourdough starters', 'medieval history', 'lucid dreaming',
  'mushroom foraging', 'time travel paradoxes', 'ancient civilizations', 'ghost stories',
  'fermented foods', 'street art', 'board game design', 'ocean mysteries',
  'parallel universes', 'coffee roasting', 'forgotten languages', 'cryptozoology',
  'minimalist living', 'bee keeping', 'aurora borealis', 'vintage cameras',
  'desert survival', 'memory palaces', 'origami art', 'arctic exploration'
];

let topicCache: { topic: string; timestamp: number } | null = null;
const CACHE_DURATION = 0; // Disabled for testing - set to 5 * 60 * 1000 for production

function getRandomFallbackTopic(): string {
  const randomIndex = Math.floor(Math.random() * FALLBACK_TOPICS.length);
  return FALLBACK_TOPICS[randomIndex];
}

function isValidTopic(topic: string): boolean {
  const words = topic.trim().split(/\s+/);
  return (
    words.length >= 1 && 
    words.length <= 4 && 
    topic.length > 3 && 
    topic.length < 50 &&
    /^[a-z\s-']+$/.test(topic)
  );
}

export async function generateRandomDateTopic(): Promise<string> {
  console.log('generateRandomDateTopic called');
  
  if (topicCache && (Date.now() - topicCache.timestamp) < CACHE_DURATION) {
    console.log('⚡ Returning cached topic:', topicCache.topic);
    return topicCache.topic;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('No OPENAI_API_KEY found in environment variables');
    throw new Error('OPENAI_API_KEY environment variable is required for topic generation');
  }
  
  console.log('OpenAI API key found:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('Cache expired or empty, generating new topic with OpenAI...');

  const prompt = `Generate a single, random, interesting topic that someone might talk about on a date. Requirements:

STRICT FORMAT:
- Exactly 1-4 words only
- ALL LOWERCASE letters
- No punctuation except hyphens or apostrophes
- No explanations or extra text
- A topic that any human being would be able to talk about. Not too technical or niche.

TOPIC CATEGORIES (pick randomly):
- Hobbies & Crafts
- Science & Nature
- Food & Culture
- Arts & Entertainment
- Mystery & Unusual
- History & Ancient
- Psychology & Philosophy
- Fun Improv Topics

EXAMPLES: "mushroom foraging", "vintage cameras", "pickle burgers", "memory palaces", "bee keeping", "origami art", "desert survival", "coffee roasting"

Return ONLY the lowercase topic, nothing else.`;

  console.log('Calling OpenAI API for topic generation...');
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 15,
    temperature: 1.3,
    presence_penalty: 0.6,
  });

  const rawTopic = response.choices[0].message.content?.trim().toLowerCase() || '';
  console.log('OpenAI raw response:', rawTopic);
  console.log('API call completed successfully!');

  let topic = rawTopic.replace(/[^\w\s'-]/g, '').trim();
  
  if (!isValidTopic(topic)) {
    console.warn('Generated topic failed validation:', topic, 'Retrying...');
    throw new Error(`Generated topic "${topic}" failed validation criteria`);
  }

  topicCache = { topic, timestamp: Date.now() };
  
  console.log('Final topic:', topic);
  return topic;
}

