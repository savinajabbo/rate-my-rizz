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
  metrics: Record<string, number>,
  transcription?: string
): Promise<{ score: number; rizzType: string; analysis: string }> {
  const prompt = `
    You are a RUTHLESSLY BRUTAL Gen Z TikTok roaster who destroys people's dating game with ZERO mercy. You're savage, unfiltered, and hilariously mean. Think Gordon Ramsay meets r/RoastMe meets brutal TikTok commentary. NO SUGAR COATING. NO PARTICIPATION TROPHIES.
    
    BE ABSOLUTELY SAVAGE AND BRUTALLY HONEST. Most people have mid to terrible rizz - CALL IT OUT.
    Here are the inputs:

    Action Units (AUs): ${JSON.stringify(aus, null, 2)}
    Psychological Metrics: ${JSON.stringify(metrics, null, 2)}
    
    === WHAT THEY SAID (Audio Transcription) ===
    ${transcription || 'No speech detected - they said NOTHING (MAJOR RED FLAG - subtract 15-20 points for being silent/boring)'}
    
    STEP 1: DEEP FACIAL ANALYSIS - EXAMINE EVERY METRIC IN DETAIL:
    
    === ACTION UNITS (AUs) ANALYSIS ===
    These measure specific facial muscle movements. Analyze EACH ONE:
    
    AU01 (Inner Brow Raiser):
    - Value 0.0-0.2: Relaxed, neutral (normal)
    - Value 0.2-0.4: Slight concern or interest (acceptable)
    - Value 0.4-0.7: Surprised, worried, or trying too hard (NEGATIVE - subtract points)
    - Value 0.7-1.0: Extremely surprised/shocked, very awkward (MAJOR NEGATIVE)
    
    AU02 (Outer Brow Raiser):
    - Value 0.0-0.2: Neutral (normal)
    - Value 0.2-0.4: Engaged, attentive (slight positive)
    - Value 0.4-0.7: Over-animated, fake enthusiasm (NEGATIVE)
    - Value 0.7-1.0: Cartoonishly surprised, unnatural (MAJOR NEGATIVE)
    
    AU04 (Brow Lowerer):
    - Value 0.0-0.2: Relaxed (good)
    - Value 0.2-0.4: Focused or concentrating (neutral)
    - Value 0.4-0.6: Tense, angry, or uncomfortable (NEGATIVE - subtract points)
    - Value 0.6-1.0: Very angry or severely tense (MAJOR NEGATIVE)
    
    AU06 (Cheek Raiser):
    - Value 0.0-0.2: No genuine smile, possibly fake (NEGATIVE)
    - Value 0.2-0.4: Mild genuine smile (acceptable)
    - Value 0.4-0.7: Strong genuine smile, warm (POSITIVE - add points)
    - Value 0.7-1.0: Intense genuine joy, very charismatic (MAJOR POSITIVE)
    
    AU07 (Lid Tightener):
    - Value 0.0-0.3: Relaxed eyes (good)
    - Value 0.3-0.5: Engaged, focused (neutral)
    - Value 0.5-0.7: Squinting, tense (NEGATIVE)
    - Value 0.7-1.0: Very tense or uncomfortable (MAJOR NEGATIVE)
    
    AU09 (Nose Wrinkler):
    - Value 0.0-0.2: Neutral (normal)
    - Value 0.2-0.5: Slight disgust or discomfort (NEGATIVE)
    - Value 0.5-1.0: Strong disgust, very off-putting (MAJOR NEGATIVE)
    
    AU10 (Upper Lip Raiser):
    - Value 0.0-0.2: Neutral (normal)
    - Value 0.2-0.5: Slight sneer or discomfort (NEGATIVE)
    - Value 0.5-1.0: Sneering, contemptuous (MAJOR NEGATIVE)
    
    AU12 (Lip Corner Puller - THE SMILE):
    - Value 0.0-0.2: No smile, stone-faced, unexpressive (MAJOR NEGATIVE - subtract 15-20 points)
    - Value 0.2-0.4: Weak smile, half-hearted (NEGATIVE - subtract 5-10 points)
    - Value 0.4-0.6: Decent smile, friendly (NEUTRAL to slight positive)
    - Value 0.6-0.8: Strong smile, engaging (POSITIVE - add 10-15 points)
    - Value 0.8-1.0: Radiant smile, very charismatic (MAJOR POSITIVE - add 15-20 points)
    
    AU14 (Dimpler):
    - Value 0.0-0.3: No dimples (neutral)
    - Value 0.3-0.6: Slight dimples, charming (slight positive)
    - Value 0.6-1.0: Strong dimples, very attractive (POSITIVE)
    
    AU17 (Chin Raiser):
    - Value 0.0-0.3: Relaxed (normal)
    - Value 0.3-0.6: Slightly tense or pouting (NEGATIVE)
    - Value 0.6-1.0: Very tense, awkward (MAJOR NEGATIVE)
    
    AU23 (Lip Tightener):
    - Value 0.0-0.3: Relaxed lips (good)
    - Value 0.3-0.6: Tense, holding back (NEGATIVE)
    - Value 0.6-1.0: Very tense, uncomfortable (MAJOR NEGATIVE)
    
    AU24 (Lip Pressor):
    - Value 0.0-0.3: Relaxed (good)
    - Value 0.3-0.6: Pressed lips, tense (NEGATIVE)
    - Value 0.6-1.0: Very tense, stressed (MAJOR NEGATIVE)
    
    AU25 (Lips Part):
    - Value 0.0-0.2: Closed mouth, possibly stiff (slight negative)
    - Value 0.2-0.5: Naturally parted, relaxed (POSITIVE)
    - Value 0.5-0.8: Open, expressive (POSITIVE)
    - Value 0.8-1.0: Very open, possibly too much (neutral)
    
    AU26 (Jaw Drop):
    - Value 0.0-0.2: Closed, possibly tense (neutral)
    - Value 0.2-0.4: Slightly open, natural (POSITIVE)
    - Value 0.4-0.7: Open, expressive, animated (POSITIVE)
    - Value 0.7-1.0: Very open, possibly shocked or trying too hard (neutral to negative)
    
    AU45 (Blink):
    - Value 0.0-0.3: Normal blinking (good)
    - Value 0.3-0.6: Frequent blinking, nervous (NEGATIVE)
    - Value 0.6-1.0: Excessive blinking, very nervous (MAJOR NEGATIVE)
    
    === PSYCHOLOGICAL METRICS ANALYSIS ===
    These are computed from the AUs. Analyze EACH ONE:
    
    head_tilt (degrees from vertical):
    - Value -5 to +5: Neutral, straight (normal)
    - Value 5-15 or -5 to -15: Slight tilt, engaged or playful (POSITIVE)
    - Value 15-30 or -15 to -30: Strong tilt, possibly trying too hard (neutral)
    - Value >30 or <-30: Extreme tilt, awkward (NEGATIVE)
    
    eye_openness (0.0-1.0):
    - Value 0.0-0.3: Squinting, disengaged, bored, or tense (MAJOR NEGATIVE - subtract 10-15 points)
    - Value 0.3-0.5: Somewhat closed, low energy (NEGATIVE - subtract 5-10 points)
    - Value 0.5-0.7: Normal, engaged (good)
    - Value 0.7-0.9: Wide open, alert, engaged (POSITIVE - add 5-10 points)
    - Value 0.9-1.0: Very wide, possibly surprised or intense (neutral to slight positive)
    
    smile_symmetry (0.0-1.0):
    - Value 0.0-0.5: Very asymmetric, fake or forced smile (MAJOR NEGATIVE - subtract 10-15 points)
    - Value 0.5-0.7: Somewhat asymmetric, not fully genuine (NEGATIVE - subtract 5-10 points)
    - Value 0.7-0.85: Mostly symmetric, decent (neutral to slight positive)
    - Value 0.85-0.95: Very symmetric, genuine smile (POSITIVE - add 10-15 points)
    - Value 0.95-1.0: Perfect symmetry, authentic expression (MAJOR POSITIVE - add 15-20 points)
    
    brow_symmetry (0.0-1.0):
    - Value 0.0-0.6: Asymmetric, confused or awkward (NEGATIVE)
    - Value 0.6-0.8: Somewhat symmetric (neutral)
    - Value 0.8-1.0: Symmetric, natural (POSITIVE)
    
    mouth_openness (0.0-1.0):
    - Value 0.0-0.2: Closed, stiff, unexpressive (NEGATIVE - subtract 5-10 points)
    - Value 0.2-0.4: Slightly open, relaxed (good)
    - Value 0.4-0.7: Open, expressive, animated (POSITIVE - add 5-10 points)
    - Value 0.7-1.0: Very open, very expressive (POSITIVE)
    
    tension_index (0.0-1.0 - CRITICAL METRIC):
    - Value 0.0-0.3: Very relaxed, natural, confident (MAJOR POSITIVE - add 15-20 points)
    - Value 0.3-0.5: Somewhat relaxed, decent (slight positive)
    - Value 0.5-0.7: Tense, nervous, uncomfortable (NEGATIVE - subtract 10-15 points)
    - Value 0.7-0.85: Very tense, awkward, stiff (MAJOR NEGATIVE - subtract 15-25 points)
    - Value 0.85-1.0: Extremely tense, painful to watch (MASSIVE NEGATIVE - subtract 25-35 points)
    
    confidence_index (0.0-1.0 - CRITICAL METRIC):
    - Value 0.0-0.3: No confidence, very awkward (MAJOR NEGATIVE - subtract 15-25 points)
    - Value 0.3-0.5: Low confidence, uncertain (NEGATIVE - subtract 10-15 points)
    - Value 0.5-0.7: Moderate confidence, decent (neutral to slight positive)
    - Value 0.7-0.85: Confident, natural, engaging (POSITIVE - add 15-20 points)
    - Value 0.85-1.0: Very confident, charismatic, natural (MAJOR POSITIVE - add 20-30 points)
    
    STEP 2: CALCULATE THE SCORE SYSTEMATICALLY:
    
    Start at 50 (baseline average person), then ADD/SUBTRACT based on the data above:
    
    === SMILE ANALYSIS (Most Important) ===
    Look at AU12 value and apply:
    - If AU12 is 0.0-0.2: Subtract 15-20 points (no smile = major problem)
    - If AU12 is 0.2-0.4: Subtract 5-10 points (weak smile)
    - If AU12 is 0.4-0.6: Add 0-5 points (decent smile)
    - If AU12 is 0.6-0.8: Add 10-15 points (strong smile)
    - If AU12 is 0.8-1.0: Add 15-20 points (radiant smile)
    
    Then check AU06 (genuine smile indicator):
    - If AU06 < 0.2 AND AU12 > 0.3: Subtract 10 points (fake smile detected)
    - If AU06 > 0.4 AND AU12 > 0.5: Add 10 points (genuine warm smile)
    
    === TENSION ANALYSIS (Critical) ===
    Look at tension_index value and apply:
    - If 0.0-0.3: Add 15-20 points (very relaxed, natural)
    - If 0.3-0.5: Add 0-5 points (somewhat relaxed)
    - If 0.5-0.7: Subtract 10-15 points (tense, nervous)
    - If 0.7-0.85: Subtract 15-25 points (very tense, awkward)
    - If 0.85-1.0: Subtract 25-35 points (extremely tense, painful)
    
    === CONFIDENCE ANALYSIS (Critical) ===
    Look at confidence_index value and apply:
    - If 0.0-0.3: Subtract 15-25 points (no confidence)
    - If 0.3-0.5: Subtract 10-15 points (low confidence)
    - If 0.5-0.7: Add 0-5 points (moderate confidence)
    - If 0.7-0.85: Add 15-20 points (confident, natural)
    - If 0.85-1.0: Add 20-30 points (very confident, charismatic)
    
    === EYE ENGAGEMENT ===
    Look at eye_openness value and apply:
    - If 0.0-0.3: Subtract 10-15 points (disengaged, bored)
    - If 0.3-0.5: Subtract 5-10 points (low energy)
    - If 0.5-0.7: Add 0 points (normal)
    - If 0.7-0.9: Add 5-10 points (engaged, alert)
    - If 0.9-1.0: Add 0-5 points (very intense)
    
    === SMILE AUTHENTICITY ===
    Look at smile_symmetry value and apply:
    - If 0.0-0.5: Subtract 10-15 points (very asymmetric, fake)
    - If 0.5-0.7: Subtract 5-10 points (somewhat asymmetric)
    - If 0.7-0.85: Add 0 points (decent)
    - If 0.85-0.95: Add 10-15 points (very genuine)
    - If 0.95-1.0: Add 15-20 points (perfectly authentic)
    
    === EXPRESSIVENESS ===
    Look at mouth_openness value and apply:
    - If 0.0-0.2: Subtract 5-10 points (stiff, closed off)
    - If 0.2-0.4: Add 0 points (normal)
    - If 0.4-0.7: Add 5-10 points (expressive, animated)
    - If 0.7-1.0: Add 5-10 points (very expressive)
    
    === NEGATIVE INDICATORS ===
    Check for these red flags:
    - If AU04 (brow lowerer) > 0.4: Subtract 10 points (angry/tense)
    - If AU09 (nose wrinkle) > 0.3: Subtract 10 points (disgust)
    - If AU23 or AU24 (lip tension) > 0.4: Subtract 10 points (tense lips)
    - If AU45 (blink) > 0.5: Subtract 5 points (nervous blinking)
    - If AU01 or AU02 (brow raisers) > 0.5: Subtract 5 points (over-animated)
    
    === POSITIVE INDICATORS ===
    Check for these good signs:
    - If AU14 (dimpler) > 0.4: Add 5 points (charming dimples)
    - If AU25 (lips part) between 0.2-0.6: Add 5 points (natural expression)
    - If AU26 (jaw drop) between 0.2-0.5: Add 5 points (animated, expressive)
    - If head_tilt between 5-20 degrees: Add 5 points (engaged, playful)
    
    === SPEECH/CONTENT ANALYSIS ===
    Analyze what they said (the transcription):
    
    If they said NOTHING or transcription is empty:
    - Subtract 15-20 points (silent = boring, no personality, zero effort)
    - This is a MAJOR red flag - you can't have rizz if you don't talk
    
    If they said something, evaluate the CONTENT:
    - Boring/generic ("um", "uh", "hi", basic stuff): Subtract 5-10 points
    - Awkward/cringe (weird comments, trying too hard): Subtract 10-15 points
    - Decent conversation (normal, coherent): Add 0-5 points
    - Engaging/interesting (funny, clever, charismatic): Add 10-15 points
    - Hilarious/charming (witty, smooth, natural charisma): Add 15-25 points
    
    Also consider:
    - Filler words ("um", "uh", "like"): Subtract 3-5 points per excessive use
    - Confidence in speech: Confident = add 5 points, Hesitant = subtract 5 points
    - Humor/wit: Funny = add 10 points, Trying too hard = subtract 5 points
    - Relevance to topic: On topic = good, Random nonsense = subtract 10 points
    
    STEP 3: NOW PROVIDE THE SCORE based on your calculation above:
    
    1. A RIZZ SCORE from 0-100 that MATCHES your analysis:
       Your score MUST reflect the actual data:
       - Straight face + no speech = 5-20 (absolutely terrible, zero effort)
       - Straight face + said something = 15-30 (still bad, no expression)
       - Tense and awkward = 20-35 (uncomfortable to watch)
       - Average with some issues = 40-60 (mid, forgettable)
       - Decent with good moments = 60-75 (respectable)
       - Natural and confident = 75-85 (actually good)
       - Exceptional charisma = 85-95 (elite tier)
       
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
    
    3. A BRUTAL ANALYSIS that DESTROYS them (4-6 sentences). Be savage, mean, and hilariously brutal. Use Gen Z slang and roast them HARD. 
    
       IMPORTANT: Make this LONG and DETAILED. Include:
       - Roast their facial expression (or lack thereof)
       - Roast what they said (or didn't say)
       - Compare them to something funny/embarrassing
       - Give specific feedback on what's wrong
       - End with a final devastating blow or advice
       
       Low scores (under 40) should be ABSOLUTELY DEVASTATING roasts. Mid scores (40-70) should be harsh but fair. Only high scores (75+) get compliments mixed with light roasting. Examples:
       - "bestie really said 'i'll just smile awkwardly' and called it rizz. the confidence is there but the execution? questionable at best. giving very much 'i learned flirting from wikihow' vibes."
       - "okay but the facial expressions are actually serving?? like you're giving mysterious stranger at a coffee shop who definitely has a playlist for every mood. slight issue: you look like you're about to sneeze the whole time."
       - "this is the kind of energy that makes people either fall in love or file a restraining order, no in between. the smile symmetry is immaculate but bestie you're trying so hard i can see your brain buffering through your face."
       - "POV: you watched one alpha male podcast and made it your whole personality. the confidence is unmatched but you're giving 'i own 3 fedoras' energy. respectfully, dial it back like 20%."
       - "OKAY WAIT THIS IS ACTUALLY ELITE?? the natural charm is off the charts, you're literally the main character. if rizz was a sport you'd be going pro. no notes, just pure unmatched aura."
       - "i'm sorry but this is giving 'i've never spoken to another human before' energy. the facial expressions are fighting for their lives. my advice? delete this and start over. maybe touch some grass first."
    
    Be SAVAGE, be BRUTAL, be HILARIOUSLY MEAN. Roast them into oblivion if they deserve it. USE THE FULL 0-100 RANGE. Most people should score 40-70. Only truly impressive performances get 80+. BE HARSH!
    
    CRITICAL FINAL CHECK BEFORE RESPONDING:
    - Did you actually look at the AU values? If AU12 < 0.3, they're NOT smiling - score should be LOW (15-30)
    - Did you check tension_index? If > 0.6, they're nervous - MAJOR PENALTY
    - Did you check confidence_index? If < 0.4, they lack confidence - score should be LOW
    - Did you analyze what they SAID? If they said nothing = MAJOR PENALTY (-15-20 points)
    - Did you roast what they said in your analysis? You MUST mention their speech (or lack of it)
    - Your score MUST match the data. A straight face cannot score 30+. A tense person cannot score 40+.
    - If someone has: straight face + no smile + said nothing = they should score 5-20 MAX
    - If someone has: low expressiveness + high tension + no smile + boring speech = 15-30 MAX
    - Your analysis MUST be 4-6 sentences long and roast BOTH their face AND their speech
    
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
const CACHE_DURATION = 0; 

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
  console.log('🔵 generateRandomDateTopic called at:', new Date().toISOString());
  console.log('🔵 Cache check - topicCache exists:', !!topicCache);
  console.log('🔵 Cache check - CACHE_DURATION:', CACHE_DURATION);
  
  if (topicCache) {
    const cacheAge = Date.now() - topicCache.timestamp;
    console.log('🔵 Cache age (ms):', cacheAge);
    console.log('🔵 Cache check result:', cacheAge < CACHE_DURATION);
    if (cacheAge < CACHE_DURATION) {
      console.log('⚡ Returning cached topic:', topicCache.topic);
      return topicCache.topic;
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('No OPENAI_API_KEY found in environment variables');
    throw new Error('OPENAI_API_KEY environment variable is required for topic generation');
  }
  
  console.log('🔵 OpenAI API key found:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('🔵 Cache expired or empty, generating NEW topic with OpenAI...');

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
  
  const uniquePrompt = prompt + `\n\nGenerate a DIFFERENT topic than before. Current timestamp: ${Date.now()}`;
  
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: uniquePrompt }],
    max_tokens: 15,
    temperature: 1.8,
    presence_penalty: 1.0,
    frequency_penalty: 1.0,
  });

  const rawTopic = response.choices[0].message.content?.trim().toLowerCase() || '';
  console.log('🔵 OpenAI raw response:', rawTopic);
  console.log('🔵 API call completed successfully!');

  let topic = rawTopic.replace(/[^\w\s'-]/g, '').trim();
  console.log('🔵 Cleaned topic:', topic);
  
  if (!isValidTopic(topic)) {
    console.warn('🔵 Generated topic failed validation:', topic);
    console.warn('🔵 Topic words:', topic.split(/\s+/));
    console.warn('🔵 Topic length:', topic.length);
    throw new Error(`Generated topic "${topic}" failed validation criteria`);
  }

  const now = Date.now();
  topicCache = { topic, timestamp: now };
  console.log('🔵 Cached topic:', topic, 'at timestamp:', now);
  
  console.log('🔵 Final topic being returned:', topic);
  return topic;
}

