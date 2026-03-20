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

  // Calculate eye openness more accurately using both eyes
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const leftEyeHeight = dist(leftEyeTop, leftEyeBottom);
  
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];
  const rightEyeHeight = dist(rightEyeTop, rightEyeBottom);
  
  const leftEyeLeftCorner = landmarks[33];
  const leftEyeRightCorner = landmarks[133];
  const leftEyeWidth = dist(leftEyeLeftCorner, leftEyeRightCorner);
  
  const rightEyeLeftCorner = landmarks[362];
  const rightEyeRightCorner = landmarks[263];
  const rightEyeWidth = dist(rightEyeLeftCorner, rightEyeRightCorner);
  
  // Calculate openness ratio for both eyes and average
  const leftEyeOpenness = leftEyeWidth > 0 ? leftEyeHeight / leftEyeWidth : 0;
  const rightEyeOpenness = rightEyeWidth > 0 ? rightEyeHeight / rightEyeWidth : 0;
  const eyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;

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

  // Tension index: measures asymmetry between left and right eye opening
  // More accurate calculation using normalized differences
  // Reuse leftEyeHeight and rightEyeHeight already calculated above
  const avgEyeOpen = (leftEyeHeight + rightEyeHeight) / 2;
  
  // Calculate relative asymmetry (difference / average)
  const eyeAsymmetry = avgEyeOpen > 0 ? Math.abs(leftEyeHeight - rightEyeHeight) / avgEyeOpen : 0;
  
  // Also check for facial tension indicators: brow position
  // Reuse browLeft and browRight already declared above
  const browAsymmetry = Math.abs(browLeft.y - browRight.y);
  
  // Normalize by face height and combine indicators
  // Reuse faceH already calculated above
  const normalizedBrowAsymmetry = faceH > 0 ? browAsymmetry / faceH : 0;
  
  // Combine eye and brow asymmetry, normalize to 0-1
  // Higher values = more tension
  const tensionIndex = Math.min(1, (eyeAsymmetry * 0.6 + normalizedBrowAsymmetry * 10 * 0.4));

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

