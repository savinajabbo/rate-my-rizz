import math

def dist(a, b):
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

def compute_metrics(landmarks, w, h):
    def px(lm):
        return (lm.x * w, lm.y * h)

        left_eye = landmarks[33]
        right_eye = landmarks[263]

        lx, ly = px(left_eye)
        rx, ry = px(right_eye)

        head_tilt = math.degrees(math.atan2(ry - ly, rx - lx))

        eye_top = landmarks[159]
        eye_bottom = landmarks[145]
        topb = dist(eye_top, eye_bottom)
        
        eye_left_corner = landmarks[133]
        eye_right_corner = landmarks[33]
        eye_width = dist(eye_left_corner, eye_right_corner)
        eye_openness = (topb / eye_width) if eye_width > 0 else 0

        lip_left = landmarks[61]
        lip_right = landmarks[291]
        lip_top = landmarks[13]

        left_dist = dist(lip_left, lip_top)
        right_dist = dist(lip_right, lip_top)

        if left_dist + right_dist == 0:
            smile_symmetry = 1.0
        else:
            smile_symmetry = 1.0 - abs(left_dist - right_dist) / (left_dist + right_dist)

        brow_left = landmarks[70]
        brow_right = landmarks[300]
        eye_center = landmarks[168]

        left_brow_dist = dist(brow_left, eye_center)
        right_brow_dist = dist(brow_right, eye_center)

        if left_brow_dist + right_brow_dist == 0:
            brow_symmetry = 1.0
        else:
            brow_symmetry = 1.0 - abs(left_brow_dist - right_brow_dist) / (left_brow_dist + right_brow_dist)
        
        mouth_top = landmarks[13]
        mouth_bottom = landmarks[14]
        mouth_open = dist(mouth_top, mouth_bottom)

        chin = landmarks[152]
        forehead = landmarks[10]
        face_h = dist(chin, forehead)
        mouth_openness = (mouth_open / face_h) if face_h > 0 else 0

        tension = abs(dist(landmarks[159], landmarks[145]) - dist(landmarks[386], landmarks[374]))
        tension_index = min(max(tension * 5, 0), 1)

        confidence_index = ((smile_symmetry * 0.4) + (eye_openness * 0.3) + (1 - tension_index) * 0.3)
        confidence_index = max(0.0, min(1.0, confidence_index))

        return {
            "head_tilt": head_tilt,
            "eye_openness": eye_openness,
            "smile_symmetry": smile_symmetry,
            "brow_symmetry": brow_symmetry,
            "mouth_openness": mouth_openness,
            "tension_index": tension_index,
            "confidence_index": confidence_index
        }