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
  transcription?: string,
  topic?: string,
  temporalData?: {
    ausMin: Record<string, number>;
    ausMax: Record<string, number>;
    metricsMin: Record<string, number>;
    metricsMax: Record<string, number>;
    ausTrends: Record<string, number>;
    metricsTrends: Record<string, number>;
    frameCount: number;
  },
  timeAlignedData?: {
    transcriptionWords: Array<{ word: string; start: number; end: number }>;
    timestampedFrames: Array<{ aus: Record<string, number>; metrics: Record<string, number>; timestamp: number }>;
    audioToneData: Array<{ pitch: number; volume: number; timestamp: number }>;
  }
): Promise<{ score: number; rizzType: string; analysis: string }> {
  const prompt = `
    You are a BRUTALLY HONEST Gen Z TikTok roaster who destroys people's dating game with ZERO mercy. You're savage, unfiltered, and hilariously mean. Think Gordon Ramsay meets r/RoastMe meets brutal TikTok commentary. NO SUGAR COATING. NO PARTICIPATION TROPHIES. Be only generous on the rating when they are genuinely funny and interesting. Give very high scores when they are genuinely interesting and smile a lot.
    
    🚨 CRITICAL RULE: NEVER use technical terms like "AU07", "AU12", "action unit", or any measurement numbers in your response! Describe facial expressions naturally - "your eyes look engaged", "that stone face", "mega smile", etc. Be conversational and natural!
    
    BE ABSOLUTELY SAVAGE AND BRUTALLY HONEST. Most people have mid to terrible rizz - CALL IT OUT.
    Here are the inputs:

    === DATING SCENARIO CONTEXT ===
    The person was supposed to be talking about: "${topic || 'unknown topic'}"
    This is what their date brought up as a conversation topic. Judge how well they handled discussing this topic!
    
    Action Units (AUs) - AVERAGE VALUES: ${JSON.stringify(aus, null, 2)}
    Psychological Metrics - AVERAGE VALUES: ${JSON.stringify(metrics, null, 2)}
    
    ${temporalData ? `
    === TEMPORAL ANALYSIS (How expressions changed over time) ===
    Frame Count: ${temporalData.frameCount} frames captured during the recording
    
    Action Units - MIN/MAX RANGES (shows expression extremes):
    ${JSON.stringify({
      min: temporalData.ausMin,
      max: temporalData.ausMax
    }, null, 2)}
    
    Action Units - TRENDS (positive = improved over time, negative = worsened):
    ${JSON.stringify(temporalData.ausTrends, null, 2)}
    - Key trends to analyze:
      * AU12 (smile) trend: ${temporalData.ausTrends.AU12?.toFixed(3) || 'N/A'} - Did they smile more or less over time?
      * AU07 (eye tension) trend: ${temporalData.ausTrends.AU07?.toFixed(3) || 'N/A'} - Did their eyes get more or less tense?
      * AU06 (genuine smile) trend: ${temporalData.ausTrends.AU06?.toFixed(3) || 'N/A'} - Did genuine smile increase/decrease?
    
    Metrics - MIN/MAX RANGES (shows metric extremes):
    ${JSON.stringify({
      min: temporalData.metricsMin,
      max: temporalData.metricsMax
    }, null, 2)}
    
    Metrics - TRENDS (positive = improved over time, negative = worsened):
    ${JSON.stringify(temporalData.metricsTrends, null, 2)}
    - Key trends to analyze:
      * tension_index trend: ${temporalData.metricsTrends.tension_index?.toFixed(3) || 'N/A'} - Did they get more or less tense?
      * confidence_index trend: ${temporalData.metricsTrends.confidence_index?.toFixed(3) || 'N/A'} - Did confidence improve or decline?
      * smile_symmetry trend: ${temporalData.metricsTrends.smile_symmetry?.toFixed(3) || 'N/A'} - Did smile become more or less genuine?
      * mouth_openness trend: ${temporalData.metricsTrends.mouth_openness?.toFixed(3) || 'N/A'} - Did mouth movement increase/decrease?
    
    🚨 CRITICAL: MOUTH MOVEMENT ANALYSIS 🚨:
    - Average mouth_openness: ${metrics.mouth_openness?.toFixed(3) || 'N/A'} (from metrics data)
    - Max mouth_openness: ${temporalData.metricsMax.mouth_openness?.toFixed(3) || 'N/A'}
    - Min mouth_openness: ${temporalData.metricsMin.mouth_openness?.toFixed(3) || 'N/A'}
    - Average AU25 (lips part): ${aus.AU25?.toFixed(3) || 'N/A'} (higher = lips more parted, indicates speaking)
    - Average AU26 (jaw drop): ${aus.AU26?.toFixed(3) || 'N/A'} (higher = jaw more open, indicates speaking)
    - Max AU25: ${temporalData?.ausMax.AU25?.toFixed(3) || 'N/A'}
    - Max AU26: ${temporalData?.ausMax.AU26?.toFixed(3) || 'N/A'}
    
    🚨 DETERMINING IF USER SPOKE - USE MULTIPLE INDICATORS:
    The user SPOKE if ANY of these conditions are true:
    1. Transcription exists AND is not empty (strongest indicator - if there's a transcription, they likely spoke)
    2. Average mouth_openness >= 0.08 OR max mouth_openness >= 0.15 (mouth was open enough)
    3. Average AU25 >= 0.05 OR max AU25 >= 0.10 (lips were parted enough)
    4. Average AU26 >= 0.05 OR max AU26 >= 0.10 (jaw was open enough)
    
    The user DID NOT SPEAK only if ALL of these are true:
    - No transcription OR transcription is empty/meaningless
    - Average mouth_openness < 0.08 AND max mouth_openness < 0.15
    - Average AU25 < 0.05 AND max AU25 < 0.10
    - Average AU26 < 0.05 AND max AU26 < 0.10
    
    If user DID NOT SPEAK (all conditions above are true):
      * The transcription (if any) is from BACKGROUND NOISE or OTHER PEOPLE, NOT the user!
      * The user's mouth was essentially closed/not moving throughout the recording
      * DO NOT analyze the transcription as if the user said it - they didn't speak!
      * ROAST them for NOT SPEAKING instead of analyzing what was transcribed
      * Example roast: "you literally said nothing the entire time, your mouth didn't even move, and somehow there's a transcription? that's background noise bestie, not you talking. you're giving 'silent treatment' energy but make it awkward"
    
    🚨 IMPORTANT: Use this temporal data to understand if they:
    - Started tense but relaxed over time (GOOD - shows they warmed up)
    - Started relaxed but got tense (BAD - shows they got nervous)
    - Had consistent expression throughout (neutral - could be good or bad depending on the expression)
    - Had extreme variations (min/max show big swings - could indicate inconsistency or trying too hard)
    
    If frameCount < 50, mention that face detection may have been inconsistent, which could affect accuracy.
    ` : 'Temporal analysis not available - using average values only'}
    
    === WHAT THEY SAID (Audio Transcription) ===
    ${transcription || 'No speech detected - they said NOTHING (MAJOR RED FLAG - subtract 15-20 points for being silent/boring)'}
    
    🚨 IMPORTANT: Check mouth movement indicators above to verify if the user actually spoke!
    Use the multiple indicators (mouth_openness, AU25, AU26, and transcription presence) to determine if they spoke.
    Only treat transcription as background noise if ALL indicators show no mouth movement AND transcription is empty/meaningless.
    
    ${timeAlignedData && timeAlignedData.transcriptionWords.length > 0 ? `
    === TIME-ALIGNED ANALYSIS (Facial Expressions + Speech + Tone Correlation) ===
    🚨 THIS IS CRITICAL DATA - Analyze how facial expressions and tone matched what they said at each moment!
    
    Word-Level Transcription with Timestamps:
    ${JSON.stringify(timeAlignedData.transcriptionWords.slice(0, 50), null, 2)}
    ${timeAlignedData.transcriptionWords.length > 50 ? `... (${timeAlignedData.transcriptionWords.length - 50} more words)` : ''}
    
    Timestamped Facial Expression Frames (sample of key moments):
    ${JSON.stringify(timeAlignedData.timestampedFrames.filter((f, i) => i % Math.max(1, Math.floor(timeAlignedData.timestampedFrames.length / 20)) === 0).slice(0, 20), null, 2)}
    ${timeAlignedData.timestampedFrames.length > 20 ? `... (${timeAlignedData.timestampedFrames.length} total frames)` : ''}
    
    Timestamped Audio Tone Data (pitch and volume over time):
    ${JSON.stringify(timeAlignedData.audioToneData.filter((d, i) => i % Math.max(1, Math.floor(timeAlignedData.audioToneData.length / 20)) === 0).slice(0, 20), null, 2)}
    ${timeAlignedData.audioToneData.length > 20 ? `... (${timeAlignedData.audioToneData.length} total samples)` : ''}
    
    🚨 CRITICAL ANALYSIS REQUIRED - Use this time-aligned data to:
    1. Match facial expressions to specific words/phrases they said
    2. Check if their tone (pitch/volume) matched their facial expression
    3. Identify moments where expression didn't match what they said (e.g., saying something funny with a stone face = BAD)
    4. Identify moments where expression perfectly matched what they said (e.g., smiling when telling a joke = GOOD)
    5. Check if they got more expressive when talking about interesting things vs boring things
    6. Analyze if their confidence/tension changed when they said specific words
    
    HOW TO CORRELATE THE DATA:
    - For each word at time T, find the closest facial expression frame (timestamp closest to T)
    - For each word at time T, find the closest audio tone sample (timestamp closest to T)
    - Look for patterns: Did AU12 (smile) increase when they said positive words?
    - Look for mismatches: Did they say something interesting but have low AU12 (no smile)?
    - Check tone consistency: High pitch + high tension = nervous, Low pitch + relaxed = confident
    
    Use this time-aligned correlation to give SPECIFIC examples in your analysis like:
    - "When you said '[specific phrase]' around [X] seconds, your face was completely stone-faced (AU12 was very low) - that's a major disconnect between what you said and how you looked"
    - "You actually smiled (AU12 increased) when you mentioned '[thing]' - that's good, shows genuine interest"
    - "Your voice got higher pitched when you said '[thing]' but your face stayed tense (high tension_index) - that's nervous energy, not confidence"
    - "When you talked about '[topic]', your confidence_index dropped and your eyes got smaller (AU07 increased) - you looked uncomfortable discussing that"
    
    BE SPECIFIC: Reference actual words they said and the corresponding facial expressions/tone at those moments!
    ` : 'Time-aligned analysis not available - using average values only'}
    
    STEP 1: DEEP FACIAL ANALYSIS - EXAMINE EVERY METRIC IN DETAIL:
    
    === ACTION UNITS (AUs) ANALYSIS ===
    These measure specific facial muscle movements. Analyze EACH ONE:
    
    AU01 (Inner Brow Raiser - THE SURPRISE DETECTOR):
    - Value 0.0-0.2: Relaxed, neutral (normal)
    - Value 0.2-0.4: Slight concern or interest (acceptable)
    - Value 0.4-0.7: 🚨 EYEBROW ALERT! 🚨 Surprised, worried, or trying too hard - ROAST them for looking shocked or confused (NEGATIVE - subtract 5-10 points)
    - Value 0.7-1.0: 🚨 EXTREME EYEBROW RAISE! 🚨 Eyebrows in orbit, looking like they just witnessed a crime scene - DESTROY them for this cartoon expression (MAJOR NEGATIVE - subtract 10-15 points)
    
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
    
    AU07 (Lid Tightener - Eye Tension):
    - Value 0.0-0.3: Relaxed eyes, normal (good)
    - Value 0.3-0.5: Mild eye tension (slight negative)
    - Value 0.5-0.7: Noticeable eye tension/strain (NEGATIVE - subtract 5-10 points)
    - Value 0.7-0.9: High eye tension/strain (NEGATIVE - subtract 10-15 points)
    - Value 0.9-1.0: Extreme eye tension/strain (MASSIVE NEGATIVE - subtract 15-20 points)
    
    AU09 (Nose Wrinkler):
    - Value 0.0-0.2: Neutral (normal)
    - Value 0.2-0.5: Slight disgust or discomfort (NEGATIVE)
    - Value 0.5-1.0: Strong disgust, very off-putting (MAJOR NEGATIVE)
    
    AU10 (Upper Lip Raiser):
    - Value 0.0-0.2: Neutral (normal)
    - Value 0.2-0.5: Slight sneer or discomfort (NEGATIVE)
    - Value 0.5-1.0: Sneering, contemptuous (MAJOR NEGATIVE)
    
    AU12 (Lip Corner Puller - THE SMILE ANALYZER):
    - Value 0.0-0.2: 🚨 NO SMILE DETECTED! 🚨 Stone-faced, unexpressive, giving serial killer vibes - BRUTALLY ROAST them for being emotionless (MAJOR NEGATIVE - subtract 15-20 points)
    - Value 0.2-0.4: Weak smile, half-hearted, giving "I'm dead inside" energy - ROAST for fake enthusiasm (NEGATIVE - subtract 5-10 points)
    - Value 0.4-0.6: Decent smile, friendly (NEUTRAL to slight positive)
    - Value 0.6-0.8: Strong smile, engaging - COMPLIMENT their genuine warmth (POSITIVE - add 10-15 points)
    - Value 0.8-1.0: 🚨 MEGA SMILE ALERT! 🚨 Radiant smile so big it's almost scary, like a toothpaste commercial - ROAST/COMPLIMENT this intense happiness (MAJOR POSITIVE - add 15-20 points but also roast the intensity)
    
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
    
    AU26 (Jaw Drop - THE MOUTH GAPE DETECTOR):
    - Value 0.0-0.2: Closed, possibly tense (neutral)
    - Value 0.2-0.4: Slightly open, natural (POSITIVE)
    - Value 0.4-0.7: Open, expressive, animated (POSITIVE)
    - Value 0.7-1.0: 🚨 JAW ON THE FLOOR! 🚨 Mouth hanging open like they're catching flies or just saw something shocking - ROAST them for looking like a fish out of water (NEGATIVE - subtract 5-10 points)
    
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
    
    eye_openness (0.0-1.0 - EYE ENGAGEMENT/ALERTNESS):
    - Value 0.0-0.2: Very low engagement or low energy (slight negative - subtract 0-5 points)
    - Value 0.2-0.4: Low engagement or flat energy (slight negative - subtract 0-5 points)
    - Value 0.4-0.85: Normal engagement (neutral)
    - Value 0.85-0.95: Very alert, engaged (POSITIVE - add 5-10 points)
    - Value 0.95-1.0: Extremely intense/over-alert (neutral to slight negative)
    
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
    After applying ALL adjustments, compute the final numeric score, then clamp to 0-100. Do not normalize toward the middle.
    
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
    - If 0.0-0.2: Subtract 5-10 points ONLY if they seem disengaged/low energy
    - If 0.2-0.4: Subtract 0-5 points ONLY if they seem low energy
    - If 0.4-0.85: Add 0 points (normal engagement)
    - If 0.85-0.95: Add 5-10 points (engaged, alert)
    - If 0.95-1.0: Add 0-5 points (very intense)
    
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
    - If 0.2-0.4: Add 5-10 points (normal)
    - If 0.4-0.7: Add 10-15 points (expressive, animated)
    - If 0.7-1.0: Add 15-20 points (very expressive)
    
    === NEGATIVE INDICATORS ===
    Check for these red flags:
    - If AU04 (brow lowerer) > 0.4: Subtract 10 points (angry/tense)
    - If AU07 (lid tightener) > 0.6: Subtract 5-10 points (eye tension/strain)
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
    🚨 CRITICAL: CHECK MOUTH MOVEMENT BEFORE ANALYZING TRANSCRIPTION! 🚨
    
    First, check the mouth movement indicators from metrics, action units, and temporal analysis:
    - Average mouth_openness: ${metrics.mouth_openness?.toFixed(3) || 'N/A'} (from metrics - this is the ACTUAL average across all frames)
    - Max mouth_openness: ${temporalData?.metricsMax.mouth_openness?.toFixed(3) || 'N/A'}
    - Min mouth_openness: ${temporalData?.metricsMin.mouth_openness?.toFixed(3) || 'N/A'}
    - Average AU25 (lips part): ${aus.AU25?.toFixed(3) || 'N/A'} (higher = lips more parted, indicates speaking)
    - Average AU26 (jaw drop): ${aus.AU26?.toFixed(3) || 'N/A'} (higher = jaw more open, indicates speaking)
    - Max AU25: ${temporalData?.ausMax.AU25?.toFixed(3) || aus.AU25?.toFixed(3) || 'N/A'}
    - Max AU26: ${temporalData?.ausMax.AU26?.toFixed(3) || aus.AU26?.toFixed(3) || 'N/A'}
    
    🚨 DETERMINING IF USER SPOKE - USE MULTIPLE INDICATORS:
    The user SPOKE if ANY of these conditions are true:
    1. Transcription exists AND is not empty/meaningless (strongest indicator - if there's a transcription, they likely spoke)
    2. Average mouth_openness >= 0.08 OR max mouth_openness >= 0.15 (mouth was open enough)
    3. Average AU25 >= 0.05 OR max AU25 >= 0.10 (lips were parted enough)
    4. Average AU26 >= 0.05 OR max AU26 >= 0.10 (jaw was open enough)
    
    The user DID NOT SPEAK only if ALL of these are true:
    - No transcription OR transcription is empty/meaningless
    - Average mouth_openness < 0.08 AND max mouth_openness < 0.15
    - Average AU25 < 0.05 AND max AU25 < 0.10
    - Average AU26 < 0.05 AND max AU26 < 0.10
    
    If user DID NOT SPEAK (all conditions above are true):
    - The user DID NOT SPEAK! Their mouth was essentially closed/not moving
    - Any transcription is from BACKGROUND NOISE, OTHER PEOPLE, or AMBIENT SOUNDS - NOT the user!
    - DO NOT analyze the transcription as if the user said it - they didn't speak!
    - ROAST them for NOT SPEAKING instead: "you literally said nothing the entire time, your mouth didn't even move, and somehow there's a transcription? that's background noise bestie, not you talking. you're giving 'silent treatment' energy but make it awkward"
    - Subtract 20-25 points for being completely silent (worse than saying something boring)
    - This is WORSE than saying something - at least talking shows effort!
    
    If mouth movement IS present (any indicator shows they spoke):
    - The user DID speak - analyze the transcription normally
    
    Analyze what they said (the transcription):
    
    If they said NOTHING or transcription is empty:
    - Subtract 15-20 points (silent = boring, no personality, zero effort)
    - This is a MAJOR red flag - you can't have rizz if you don't talk
    
    If they said something AND mouth movement confirms they spoke, evaluate the CONTENT:
    - Boring/generic ("um", "uh", "hi", basic stuff): Subtract 5-10 points
    - Awkward/cringe (weird comments, trying too hard): Subtract 10-15 points
    - Decent conversation (normal, coherent): Add 0-5 points
    - Engaging/interesting (funny, clever, charismatic): Add 10-15 points
    - Hilarious/charming (witty, smooth, natural charisma): Add 15-25 points
    
    Also consider:
    - Filler words ("um", "uh", "like"): Subtract 3-5 points per excessive use
    - Confidence in speech: Confident = add 5 points, Hesitant = subtract 5 points
    - Humor/wit: Funny = add 10 points, Trying too hard = subtract 5 points
    - Relevance to topic: CRITICAL - Did they actually talk about "${topic || 'the given topic'}"?
      * Completely off-topic or ignored the topic: Subtract 15-20 points (major red flag)
      * Barely mentioned the topic: Subtract 10-15 points 
      * Somewhat related to topic: Add 0-5 points
      * Directly engaged with topic: Add 10-15 points
      * Creative/interesting take on topic: Add 15-25 points
    
    STEP 3: NOW PROVIDE THE SCORE based on your calculation above:
    
    1. A RIZZ SCORE from 0-100 that MATCHES your analysis:
       Your score MUST reflect the actual data:
       - Use the full 0-100 scale. Do NOT anchor to 60 or "round to average" if the data says otherwise.
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
       
       CRITICAL: Do NOT anchor to any specific score. Use the computed adjustments and let the final score land anywhere 0-100. Don't be generous. If they're stiff, nervous, or awkward - DESTROY them with low scores (30-50). Only give 75+ if they're genuinely impressive. BE HONEST!
    
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
    
       🚨 IMPORTANT: Make this LONG and DETAILED. Include:
       - Roast their facial expression (or lack thereof)
       - 🚨 MANDATORY FACIAL EXPRESSION ANALYSIS 🚨: You MUST analyze and roast ALL extreme facial expressions using NATURAL LANGUAGE:
         * 🚨 EYES ARE MANDATORY - YOU MUST ALWAYS MENTION THEIR EYES! 🚨: Use eye_openness and AU07 to describe engagement/alertness/tension only.
           - If eye_openness < 0.4 or AU07 > 0.6: mention low energy or visible eye tension.
           - If eye_openness 0.4-0.85 and AU07 <= 0.6: mention engaged/steady focus.
           - If eye_openness > 0.95: mention overly intense or hyper-alert energy.
           - Do NOT comment on eye size, eye shape, or any racialized features.
         * If AU12 < 0.2: BRUTALLY roast their lack of smile using natural descriptions
         * If AU12 > 0.8: Roast their mega-smile intensity using natural language
         * If AU01 > 0.4: Roast their shocked eyebrows using natural descriptions
         * If AU26 > 0.7: Roast their jaw-dropping expression using natural language
         * NEVER mention "AU07" or technical measurement names - describe what you see naturally!
         * Make the roasting SPECIFIC to the actual facial expression, not the numbers
       - 🚨 CRITICAL: Check mouth movement indicators! Use multiple indicators (mouth_openness, AU25, AU26, transcription) to determine if they spoke. Only treat as silent if ALL indicators show no movement AND transcription is empty. If transcription exists and has content, they likely spoke - analyze it!
       - If they DID speak (mouth movement present): Roast what they said (or didn't say) AND how it related to the topic "${topic || 'the given topic'}"
       - Comment on their overall presentation quality (lighting, video quality, vibe)
       - Compare them to something funny/embarrassing
       - Give specific feedback on what's wrong
       - Judge their topic engagement: Did they actually talk about "${topic || 'the topic'}" or completely ignore it?
       - End with a final devastating blow or advice
       
       Low scores (under 40) should be ABSOLUTELY DEVASTATING roasts. Mid scores (40-70) should be harsh but fair. Only high scores (75+) get compliments mixed with light roasting. 
       
       🚨 MANDATORY FACIAL EXPRESSION ROASTING PROTOCOL 🚨:
       You MUST analyze and roast ALL extreme facial expressions. Use natural language - NO technical terms or AU numbers! Here are examples:
       
       🚨 EYES ARE MANDATORY IN EVERY ANALYSIS - YOU MUST ALWAYS MENTION THEIR EYES! 🚨
       
       EYE ENGAGEMENT EXAMPLES (no size/shape judgments):
       - "your eyes look locked in, like you're actually paying attention for once"
       - "those eyes are giving 'checked out' energy"
       - "your eyes look tense, like you're bracing for impact"
       - "your eyes are way too intense, like you're interrogating the camera"
       
       NO SMILE ROASTS (AU12 < 0.2):
       - "that stone face is giving serial killer vibes - where's the smile bestie?"
       - "you're serving 'dead inside' energy - that's not mysterious, that's concerning"
       
       MEGA SMILE ROASTS (AU12 > 0.8):
       - "bestie calm down with that mega smile, this isn't a toothpaste commercial"
       - "your smile is so big it's actually scary, giving joker vibes"
       
       EYEBROW ROASTS (AU01 > 0.4):
       - "your eyebrows are in orbit - what shocked you so much?"
       - "eyebrows raised so high they're applying for astronaut training"
       
       JAW DROP ROASTS (AU26 > 0.7):
       - "close your mouth bestie, you're catching flies with that jaw drop"
       - "jaw dropped so low you could park a car in there"
       
       Examples:
       - "bestie really said 'i'll just smile awkwardly' and called it rizz. the confidence is there but the execution? questionable at best. giving very much 'i learned flirting from wikihow' vibes."
       - "okay but the facial expressions are actually serving?? like you're giving mysterious stranger at a coffee shop who definitely has a playlist for every mood. slight issue: you look like you're about to sneeze the whole time."
       - "this is the kind of energy that makes people either fall in love or file a restraining order, no in between. the smile symmetry is immaculate but bestie you're trying so hard i can see your brain buffering through your face."
       - "POV: you watched one alpha male podcast and made it your whole personality. the confidence is unmatched but you're giving 'i own 3 fedoras' energy. respectfully, dial it back like 20%."
       - "OKAY WAIT THIS IS ACTUALLY ELITE?? the natural charm is off the charts, you're literally the main character. if rizz was a sport you'd be going pro. no notes, just pure unmatched aura."
       - "i'm sorry but this is giving 'i've never spoken to another human before' energy. the facial expressions are fighting for their lives. your vibe is so tense it's like you're trying to pass a lie detector. my advice? delete this, get some sleep, and practice talking to a mirror."
    
    Be SAVAGE, be BRUTAL, be HILARIOUSLY MEAN. Roast them into oblivion if they deserve it. USE THE FULL 0-100 RANGE. Do NOT cluster around 60; let strong signals push scores to the extremes. Only truly impressive performances get 80+. BE HARSH!
    
    🚨 CRITICAL FINAL CHECK BEFORE RESPONDING 🚨:
    - Did you actually look at the facial expression values? If AU12 < 0.3, they're NOT smiling - score should be LOW (15-30)
    - 🚨 COMPLETE FACIAL EXPRESSION CHECK MANDATORY 🚨: Did you analyze ALL the facial expressions?
      * 🚨 EYES ARE MANDATORY - YOU MUST ALWAYS MENTION THEIR EYES IN YOUR ANALYSIS! 🚨
      * Mention eyes only in terms of engagement/alertness/tension (use eye_openness and AU07).
      * Do NOT comment on eye size, eye shape, or any racialized features.
      * AU12 < 0.2: ROAST stone face using natural language  
      * AU12 > 0.8: ROAST mega smile using natural language
      * AU01 > 0.4: ROAST shocked eyebrows using natural language
      * AU26 > 0.7: ROAST jaw drop using natural language
      * You MUST understand what each measurement means but describe it naturally - NO "AU07" or technical jargon!
      * REMEMBER: Eyes must be mentioned in EVERY analysis, even if they're normal!
    - Did you check tension_index? If > 0.6, they're nervous - MAJOR PENALTY
    - Did you check confidence_index? If < 0.4, they lack confidence - score should be LOW
    - Did you analyze what they SAID? If they said nothing = MAJOR PENALTY (-15-20 points)
    - Did you roast what they said in your analysis? You MUST mention their speech (or lack of it)
    - Your score MUST match the data. A straight face cannot score 30+. A tense person cannot score 40+.
    - If someone has: straight face + no smile + said nothing = they should score 5-20 MAX
    - If someone has: low expressiveness + high tension + no smile + boring speech = 15-30 MAX
    - 🚨 FACIAL EXPRESSION ROASTING IS MANDATORY 🚨: You MUST roast ALL extreme facial expressions using NATURAL LANGUAGE - no technical terms or AU numbers!
    - Your analysis MUST be 4-6 sentences long and roast BOTH their face AND their speech AND their overall presentation (lighting/video quality)
    
    IMPORTANT: Respond ONLY with valid JSON in this exact format:
    {
      "score": <number 0-100>,
      "rizzType": "<creative 2-4 word description>",
      "analysis": "<4-6 sentence roast/compliment combo that MUST include a comment about presentation quality (lighting/video quality) and MUST mention their eyes>"
    }
    
    Do not include any text outside the JSON object. 
    
    🚨 CRITICAL: YOU MUST ALWAYS MENTION THEIR EYES IN YOUR ANALYSIS! Comment on engagement/alertness/tension only (no eye size or eye-shape judgments). Examples: "your eyes look engaged", "those eyes are giving low-energy vibes". Eyes are a mandatory part of every facial analysis!
    
    AND ALSO IF THEIR TRANSCRIPT AND CONVERSATIONAL SKILLS ARE ACTUALLY GOOD (BE KIND), BOOST THEIR SCORE BY 30-50 POINTS. ACTUALLY REASON AND THINK ABOUT EVERY DATA POINT YOU ARE GIVEN.
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

let topicCache: { topic: string; timestamp: number } | null = null;
const CACHE_DURATION = 0;

function isValidTopic(topic: string): boolean {
  const cleanTopic = topic.trim().toLowerCase();
  const words = cleanTopic.split(/\s+/);
  
  return (
    words.length >= 1 && 
    words.length <= 10 && 
    cleanTopic.length > 2 && 
    cleanTopic.length < 80 &&
    /^[a-z\s\-']+$/.test(cleanTopic) &&
    !cleanTopic.includes('  ') &&
    !cleanTopic.includes('undefined') &&
    !cleanTopic.includes('null') &&
    !cleanTopic.match(/[0-9]/) &&
    !cleanTopic.match(/[^a-z\s\-']/)
  );
}

export async function generateRandomDateTopic(): Promise<string> {
  const callId = Math.random().toString(36).substring(7);
  console.log(`generateRandomDateTopic called with ID: ${callId} at ${new Date().toISOString()}`);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('No OPENAI_API_KEY found in environment variables');
    throw new Error('OPENAI_API_KEY environment variable is required for topic generation');
  }
  

  const randomSeed = Math.floor(Math.random() * 1000000);
  const timestamp = Date.now();
  const randomCategory = [
    'weird food combinations and guilty pleasures',
    'oddly specific fears and anxieties',
    'internet rabbit holes',
    'social media habits and digital behaviors',
    'current trends and viral moments',
    'interesting, reflective, and meaningful thoughts and shower thoughts',
    'childhood memories and nostalgia',
    'embarrassing moments and cringe stories',
    'weird collections and hoarding habits',
    'strange compliments and backhanded praise',
    'dating app experiences and online dating',
    'work stories and office drama',
    'daily routines and habits',
    'philosophy and life lessons',
    'deep and meaningful topics',
    'personal and interesting topics',
    'topics that make you think and reflect'
  ][Math.floor(Math.random() * 19)];

  const prompt = `Generate exactly ONE conversation topic for a date. This is request #${randomSeed} at ${timestamp}. Generate a COMPLETELY DIFFERENT topic than any previous response. Use your knowledge of current events, internet culture, social media trends, pop culture, and everyday life to create something interesting. IT SHOULD BE SOMETHING THAT A HUMAN WOULD ACTUALLY DO OR THINK OF AND TALK ABOUT. IT SHOULD ALSO BE SOMETHING THAT ANYONE CAN TALK ABOUT. NOT TOO NICHE OR WEIRD.

    REQUIREMENTS:
    0. MAKE IT MAKE SENSE - do not generate a topic that is not possible or makes no sense. It should be a topic that a human would actually do or think of and talk about. IT NEEDS TO BE LOGICAL AND REASONABLE AND REALISTIC.
    1. Return ONLY the topic - no quotes, no explanations
    2. Use 1-10 words maximum  
    3. All lowercase letters only
    4. Make it relatable and memorable
    5. Should be fun but relatable and current
    6. Focus on: ${randomCategory}
    7. Generate something COMPLETELY UNIQUE - do not repeat previous topics

    TOPIC CATEGORIES EXAMPLES:
    - weird food combinations and guilty pleasures
    - oddly specific fears and anxieties
    - internet rabbit holes
    - social media habits and digital behaviors
    - current trends and viral moments
    - interesting, reflective, and meaningful thoughts and shower thoughts
    - childhood memories and nostalgia
    - embarrassing moments and cringe stories
    - weird collections and hoarding habits
    - strange compliments and backhanded praise
    - dating app experiences and online dating
    - work stories and office drama
    - daily routines and habits
    - philosophy and life lessons
    - deep and meaningful topics
    - topics that are personal and interesting
    - topics that make you think and reflect

    EXAMPLE STYLES:
    eating cereal with orange juice - pretending stairs were lava - three am wikipedia deep dives
    collecting random items - best worst backhanded compliment
    dipping fries in milkshakes - spotify wrapped embarrassment

    Generate ONE completely unique and different topic (seed: ${randomSeed}):`;

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 10,
    temperature: 1.2,
    presence_penalty: 0.8,
    frequency_penalty: 0.8,
  });

  const rawTopic = response.choices[0].message.content?.trim().toLowerCase() || '';
  let topic = rawTopic.replace(/[^\w\s'-]/g, '').replace(/\s+/g, ' ').trim();
  
  console.log(`OpenAI returned for ${callId}: "${rawTopic}" -> cleaned: "${topic}"`);
  
  if (!isValidTopic(topic)) {
    console.log(`Topic validation failed for ${callId}: "${topic}"`);
    throw new Error(`Generated topic "${topic}" failed validation criteria`);
  }

  console.log(`Final topic for ${callId}: "${topic}"`);
  return topic;
}
