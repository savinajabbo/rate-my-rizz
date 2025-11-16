function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function px(lm: { x: number; y: number }, w: number, h: number): [number, number] {
  return [lm.x * w, lm.y * h];
}

export function computeMetrics(landmarks: any[], w: number, h: number): Record<string, number> {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const [lx, ly] = px(leftEye, w, h);
  const [rx, ry] = px(rightEye, w, h);

  const headTilt = (Math.atan2(ry - ly, rx - lx) * 180) / Math.PI;

  const eyeTop = landmarks[159];
  const eyeBottom = landmarks[145];
  const topb = dist(eyeTop, eyeBottom);

  const eyeLeftCorner = landmarks[133];
  const eyeRightCorner = landmarks[33];
  const eyeWidth = dist(eyeLeftCorner, eyeRightCorner);
  const eyeOpenness = eyeWidth > 0 ? topb / eyeWidth : 0;

  const lipLeft = landmarks[61];
  const lipRight = landmarks[291];
  const lipTop = landmarks[13];

  const leftDist = dist(lipLeft, lipTop);
  const rightDist = dist(lipRight, lipTop);

  const smileSymmetry =
    leftDist + rightDist === 0
      ? 1.0
      : 1.0 - Math.abs(leftDist - rightDist) / (leftDist + rightDist);

  const browLeft = landmarks[70];
  const browRight = landmarks[300];
  const eyeCenter = landmarks[168];

  const leftBrowDist = dist(browLeft, eyeCenter);
  const rightBrowDist = dist(browRight, eyeCenter);

  const browSymmetry =
    leftBrowDist + rightBrowDist === 0
      ? 1.0
      : 1.0 - Math.abs(leftBrowDist - rightBrowDist) / (leftBrowDist + rightBrowDist);

  const mouthTop = landmarks[13];
  const mouthBottom = landmarks[14];
  const mouthOpen = dist(mouthTop, mouthBottom);

  const chin = landmarks[152];
  const forehead = landmarks[10];
  const faceH = dist(chin, forehead);
  const mouthOpenness = faceH > 0 ? mouthOpen / faceH : 0;

  const tension = Math.abs(
    dist(landmarks[159], landmarks[145]) - dist(landmarks[386], landmarks[374])
  );
  const tensionIndex = Math.min(Math.max(tension * 5, 0), 1);

  const confidenceIndex = Math.max(
    0.0,
    Math.min(
      1.0,
      smileSymmetry * 0.4 + eyeOpenness * 0.3 + (1 - tensionIndex) * 0.3
    )
  );

  return {
    head_tilt: headTilt,
    eye_openness: eyeOpenness,
    smile_symmetry: smileSymmetry,
    brow_symmetry: browSymmetry,
    mouth_openness: mouthOpenness,
    tension_index: tensionIndex,
    confidence_index: confidenceIndex,
  };
}

