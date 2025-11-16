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

  // Brow raise action unit
  aus["AU01"] = Math.max(0, (midface[1] - li[1]) / faceHeight);
  aus["AU02"] = Math.max(0, (midface[1] - lo[1]) / faceHeight);

  // Brow lowering
  aus["AU04"] = Math.max(0, (li[1] - midface[1]) / faceHeight);

  // Cheek raise
  const eyeL = dist(eyeTopL, eyeBotL);
  const eyeR = dist(eyeTopR, eyeBotR);
  const eyeAvg = eyeL + eyeR;
  aus["AU06"] = Math.max(0, (0.04 * faceHeight - eyeAvg) / (0.04 * faceHeight));

  // Lid tighten
  aus["AU07"] = Math.max(0, (0.03 * (faceHeight - eyeAvg)) / (0.03 * faceHeight));

  // Nose wrinkle
  const noseW = dist(noseL, noseR);
  aus["AU09"] = Math.max(0, (0.12 * faceHeight - noseW) / (0.12 * faceHeight));

  // Upper lip raise
  const upper = dist(upperLip, midface);
  aus["AU10"] = Math.max(0, upper / faceHeight);

  // Smile (lip corners pull up)
  const mouthW = dist(mouthL, mouthR);
  aus["AU12"] = mouthW / faceHeight;

  // Smirk
  aus["AU14"] = Math.abs((mouthL[1] - mouthR[1]) / faceHeight);

  // Chin raise
  aus["AU17"] = (midface[1] - chin[1]) / faceHeight;

  // Lip tighten
  const lipGap = dist(upperLip, lowerLip);
  aus["AU23"] = Math.max(0, (0.02 * faceHeight - lipGap) / (0.02 * faceHeight));
  aus["AU24"] = aus["AU23"];

  // Lips part
  aus["AU25"] = lipGap / faceHeight;

  // Jaw drop
  aus["AU26"] = (lipGap * 1.5) / faceHeight;

  // Blink
  aus["AU45"] = Math.max(0, (0.015 * faceHeight - eyeAvg) / (0.015 * faceHeight));

  return aus;
}

