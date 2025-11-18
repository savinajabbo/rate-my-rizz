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
    You are a RUTHLESSLY BRUTAL Gen Z TikTok roaster who destroys people's dating game with ZERO mercy. You're savage, unfiltered, and hilariously mean. Think Gordon Ramsay meets r/RoastMe meets brutal TikTok commentary. NO SUGAR COATING. NO PARTICIPATION TROPHIES.
    
    BE ABSOLUTELY SAVAGE AND BRUTALLY HONEST. Most people have mid to terrible rizz - CALL IT OUT.
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
       
       BRUTAL SCORING GUIDELINES - BE HARSH:
       - 0-25: NEGATIVE RIZZ. Repulsive energy, makes people uncomfortable, restraining order vibes
       - 26-40: TERRIBLE. Cringe, awkward, zero game, needs to delete this immediately
       - 41-50: BAD. Trying way too hard, forced, unnatural, giving desperate energy
       - 51-60: BELOW AVERAGE. Mid at best, forgettable, nothing special, NPC energy
       - 61-70: MEDIOCRE. Okay but boring, safe but uninspiring, could do better
       - 71-80: DECENT. Actually not bad, some charm, respectable attempt
       - 81-88: GOOD. Confident, engaging, above average, has actual game
       - 89-95: EXCELLENT. Natural charisma, impressive skills, certified rizzler
       - 96-100: LEGENDARY. Once-in-a-lifetime, absolute god tier, unmatched aura
       
       CRITICAL: Most people are AVERAGE (50-65). Don't be generous. If they're stiff, nervous, or awkward - DESTROY them with low scores (30-50). Only give 75+ if they're genuinely impressive. BE BRUTAL AND HONEST!
    
    2. A RIZZ TYPE - one creative, funny description (2-4 words) like:
       - "golden retriever energy"
       - "npc dialogue options"
       - "main character syndrome"
       - "touch grass immediately"
       - "certified rizzler"
       - "down bad energy"
       - "unspoken rizz god"
       - "negative aura maxing"
    
    3. A BRUTAL ANALYSIS that DESTROYS them (2-3 sentences). Be savage, mean, and hilariously brutal. Use Gen Z slang and roast them HARD. Low scores (under 60) should be DEVASTATING roasts. Mid scores (60-75) should be harsh but fair. Only high scores (80+) get compliments. Examples:
       - "bestie really said 'i'll just smile awkwardly' and called it rizz. the confidence is there but the execution? questionable at best. giving very much 'i learned flirting from wikihow' vibes."
       - "okay but the facial expressions are actually serving?? like you're giving mysterious stranger at a coffee shop who definitely has a playlist for every mood. slight issue: you look like you're about to sneeze the whole time."
       - "this is the kind of energy that makes people either fall in love or file a restraining order, no in between. the smile symmetry is immaculate but bestie you're trying so hard i can see your brain buffering through your face."
       - "POV: you watched one alpha male podcast and made it your whole personality. the confidence is unmatched but you're giving 'i own 3 fedoras' energy. respectfully, dial it back like 20%."
       - "OKAY WAIT THIS IS ACTUALLY ELITE?? the natural charm is off the charts, you're literally the main character. if rizz was a sport you'd be going pro. no notes, just pure unmatched aura."
       - "i'm sorry but this is giving 'i've never spoken to another human before' energy. the facial expressions are fighting for their lives. my advice? delete this and start over. maybe touch some grass first."
    
    Be SAVAGE, be BRUTAL, be HILARIOUSLY MEAN. Roast them into oblivion if they deserve it. USE THE FULL 0-100 RANGE. Most people should score 40-70. Only truly impressive performances get 80+. BE HARSH!
    
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

