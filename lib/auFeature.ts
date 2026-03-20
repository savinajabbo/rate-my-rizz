const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;

const LEFT_EYEBROW_INNER = 70;
const RIGHT_EYEBROW_INNER = 300;

const LEFT_EYEBROW_OUTER = 105;
const RIGHT_EYEBROW_OUTER = 334;

const NOSE_WRINKLE_LEFT = 9;
const NOSE_WRINKLE_RIGHT = 107;

const MOUTH_LEFT = 61;
const MOUTH_RIGHT = 291;
const UPPER_LIP = 13;
const LOWER_LIP = 14;

const CHIN = 152;
const MID_FACE = 1;

function dist(a: [number, number], b: [number, number]): number {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

function getPoint(landmarks: any[], idx: number, w: number, h: number): [number, number] {
  return [landmarks[idx].x * w, landmarks[idx].y * h];
}

export function computeAUs(landmarks: any[], w: number, h: number): Record<string, number> {
  const aus: Record<string, number> = {};

  const li = getPoint(landmarks, LEFT_EYEBROW_INNER, w, h);
  const ri = getPoint(landmarks, RIGHT_EYEBROW_INNER, w, h);
  const lo = getPoint(landmarks, LEFT_EYEBROW_OUTER, w, h);
  const ro = getPoint(landmarks, RIGHT_EYEBROW_OUTER, w, h);

  const eyeTopL = getPoint(landmarks, LEFT_EYE_TOP, w, h);
  const eyeBotL = getPoint(landmarks, LEFT_EYE_BOTTOM, w, h);
  const eyeTopR = getPoint(landmarks, RIGHT_EYE_TOP, w, h);
  const eyeBotR = getPoint(landmarks, RIGHT_EYE_BOTTOM, w, h);

  const noseL = getPoint(landmarks, NOSE_WRINKLE_LEFT, w, h);
  const noseR = getPoint(landmarks, NOSE_WRINKLE_RIGHT, w, h);

  const mouthL = getPoint(landmarks, MOUTH_LEFT, w, h);
  const mouthR = getPoint(landmarks, MOUTH_RIGHT, w, h);
  const upperLip = getPoint(landmarks, UPPER_LIP, w, h);
  const lowerLip = getPoint(landmarks, LOWER_LIP, w, h);

  const chin = getPoint(landmarks, CHIN, w, h);
  const midface = getPoint(landmarks, MID_FACE, w, h);

  const faceHeight = dist(chin, midface);

  aus["AU01"] = Math.max(0, (midface[1] - li[1]) / faceHeight);
  aus["AU02"] = Math.max(0, (midface[1] - lo[1]) / faceHeight);

  aus["AU04"] = Math.max(0, (li[1] - midface[1]) / faceHeight);

  // Calculate eye opening (height) for both eyes
  const eyeL = dist(eyeTopL, eyeBotL);
  const eyeR = dist(eyeTopR, eyeBotR);
  const eyeAvg = (eyeL + eyeR) / 2; // Average eye opening height
  
  // Calculate eye width for normalization
  const eyeLeftCornerL = getPoint(landmarks, 33, w, h); // Left eye outer corner
  const eyeRightCornerL = getPoint(landmarks, 133, w, h); // Left eye inner corner
  const eyeLeftCornerR = getPoint(landmarks, 362, w, h); // Right eye inner corner
  const eyeRightCornerR = getPoint(landmarks, 263, w, h); // Right eye outer corner
  const eyeWidthL = dist(eyeLeftCornerL, eyeRightCornerL);
  const eyeWidthR = dist(eyeLeftCornerR, eyeRightCornerR);
  const eyeWidthAvg = (eyeWidthL + eyeWidthR) / 2;
  
  // AU06: Cheek Raiser (genuine smile indicator) - measures how much eyes are squinted when smiling
  // Normalized by eye width: when smiling genuinely, eyes squint (height/width ratio decreases)
  const eyeOpennessRatio = eyeWidthAvg > 0 ? eyeAvg / eyeWidthAvg : 0;
  // Baseline: normal eye openness is around 0.15-0.25 of eye width
  // When smiling genuinely, this decreases (eyes squint)
  const baselineEyeOpenness = 0.20; // Normal eye openness ratio
  aus["AU06"] = Math.max(0, Math.min(1, (baselineEyeOpenness - eyeOpennessRatio) / baselineEyeOpenness));

  // AU07: Lid Tightener - measures how tight/closed the eyes are
  // Higher values = more closed/tight eyes
  // When eyes are open normally, eyeOpennessRatio should be around 0.15-0.30, so AU07 should be low
  // When eyes are closed/squinted, eyeOpennessRatio < 0.10, so AU07 increases
  // FIXED: Only detect squinting when eyes are ACTUALLY closed, not just slightly less open
  if (baselineEyeOpenness > 0 && eyeOpennessRatio >= 0 && !isNaN(eyeOpennessRatio) && isFinite(eyeOpennessRatio)) {
    // Normal eye openness is typically 0.15-0.30 (height/width ratio)
    // Only consider it squinting if ratio is significantly below normal (less than 0.10)
    // This prevents false positives for normal eyes
    if (eyeOpennessRatio < 0.10) {
      // Eyes are actually squinted/closed
      // Scale: 0.10 = 0.3 AU07, 0.05 = 0.7 AU07, 0.0 = 1.0 AU07
      aus["AU07"] = Math.max(0, Math.min(1, (0.10 - eyeOpennessRatio) / 0.10));
    } else {
      // Eyes are open normally - AU07 should be very low or zero
      aus["AU07"] = 0;
    }
  } else {
    aus["AU07"] = 0; // Default to relaxed if calculation fails
  }

  const noseW = dist(noseL, noseR);
  aus["AU09"] = Math.max(0, (0.12 * faceHeight - noseW) / (0.12 * faceHeight));

  const upper = dist(upperLip, midface);
  aus["AU10"] = Math.max(0, upper / faceHeight);

  // AU12: Lip Corner Puller (smile) - measures mouth width relative to face
  // Need to account for baseline mouth width (neutral expression)
  const mouthW = dist(mouthL, mouthR);
  if (faceHeight > 0) {
    // Baseline mouth width is typically around 0.15-0.20 of face height
    const baselineMouthWidth = 0.17 * faceHeight;
    // Calculate smile intensity: how much wider than baseline
    const smileIntensity = Math.max(0, (mouthW - baselineMouthWidth) / baselineMouthWidth);
    // Normalize to 0-1 range (cap at 2x baseline = very wide smile)
    aus["AU12"] = Math.min(1, smileIntensity / 2);
  } else {
    aus["AU12"] = 0; // Default to no smile if face height is invalid
  }

  aus["AU14"] = Math.abs((mouthL[1] - mouthR[1]) / faceHeight);

  aus["AU17"] = (midface[1] - chin[1]) / faceHeight;

  const lipGap = dist(upperLip, lowerLip);
  aus["AU23"] = Math.max(0, (0.02 * faceHeight - lipGap) / (0.02 * faceHeight));
  aus["AU24"] = aus["AU23"];

  aus["AU25"] = lipGap / faceHeight;

  aus["AU26"] = (lipGap * 1.5) / faceHeight;

  // AU45: Blink detection - measures if eyes are very closed (blinking)
  // Use the same eye openness ratio, but threshold for blink detection
  // Blink threshold: eye openness < 0.1 of baseline (very closed)
  const blinkThreshold = baselineEyeOpenness * 0.1;
  aus["AU45"] = eyeOpennessRatio < blinkThreshold ? 1 - (eyeOpennessRatio / blinkThreshold) : 0;

  return aus;
}

