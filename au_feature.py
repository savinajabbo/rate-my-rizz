import numpy as np
import cv2

LEFT_EYE_TOP = 159
LEFT_EYE_BOTTOM = 145
RIGHT_EYE_TOP = 386
RIGHT_EYE_BOTTOM = 374

LEFT_EYEBROW_INNER = 70
RIGHT_EYEBROW_INNER = 300

LEFT_EYEBROW_OUTER = 105
RIGHT_EYEBROW_OUTER = 334

NOSE_WRINKLE_LEFT = 9
NOSE_WRINKLE_RIGHT = 107

MOUTH_LEFT = 61
MOUTH_RIGHT = 291
UPPER_LIP = 13
LOWER_LIP = 14

CHIN = 152
MID_FACE = 1

def dist(a, b):
    return np.linalg.norm(np.array(a) - np.array(b))

def get_point(lm, idx, w, h):
    return (lm[idx].x * w, lm[idx].y * h)

def compute_aus(landmarks, w, h):
    aus = {}

    li = get_point(landmarks, LEFT_EYEBROW_INNER, w, h)
    ri = get_point(landmarks, RIGHT_EYEBROW_INNER, w, h)

    lo = get_point(landmarks, LEFT_EYEBROW_OUTER, w , h)
    ro = get_point(landmarks, RIGHT_EYEBROW_OUTER, w, h)

    eye_top_L = get_point(landmarks, LEFT_EYE_TOP, w, h)
    eye_bot_L = get_point(landmarks, LEFT_EYE_BOTTOM, w, h)
    eye_top_R = get_point(landmarks, RIGHT_EYE_TOP, w, h)
    eye_bot_R = get_point(landmarks, RIGHT_EYE_BOTTOM, w, h)

    noseL = get_point(landmarks, NOSE_WRINKLE_LEFT, w, h)
    noseR = get_point(landmarks, NOSE_WRINKLE_RIGHT, w, h)

    mouthL = get_point(landmarks, MOUTH_LEFT, w, h)
    mouthR = get_point(landmarks, MOUTH_RIGHT, w, h)
    upperLip = get_point(landmarks, UPPER_LIP, w, h)
    lowerLip = get_point(landmarks, LOWER_LIP, w, h)

    chin = get_point(landmarks, CHIN, w, h)
    midface = get_point(landmarks, MID_FACE, w, h)

    face_height = dist(chin, midface)

    # brow raise action unit
    aus["AU01"] = max(0, midface[1] - li[1] / face_height)
    aus["AU02"] = max(0, midface[1]- lo[1] / face_height)

    # brow lowering
    aus["AU04"] = max(0, (li[1] - midface[1]) / face_height)

    # cheek raise
    eye_L = dist(eye_top_L, eye_bot_L)
    eye_R = dist(eye_top_R, eye_bot_R)
    eye_avg = (eye_L + eye_R)
    aus["AU06"] = max(0, (0.04 * face_height - eye_avg) / (0.04 * face_height))

    # lid tighten 
    aus["AU07"] = max(0, 0.03 * (face_height - eye_avg) / (0.03 * face_height))

    # nose wrinkle
    nose_w = dist(noseL, noseR)
    aus["AU09"] = max(0, (0.12 * face_height - nose_w) / (0.12 * face_height))

    # upper lip raise
    upper = dist(upperLip, midface)
    aus["AU10"] = max(0, (upper / face_height))

    # smile (lip corners pull up)
    mouth_w = dist(mouthL, mouthR)
    aus["AU12"] = mouth_w / face_height

    # smirk
    aus["AU14"] = abs((mouthL[1] - mouthR[1]) / face_height)

    # chin raise
    aus["AU17"] = (midface[1] - chin[1]) / face_height

    # lip tighten
    lip_gap = dist(upperLip, lowerLip)
    aus["AU23"] = max(0, (0.02 * face_height - lip_gap) / (0.02 * face_height))
    aus["AU24"] = aus["AU23"]

    # lips part
    aus["AU25"] = lip_gap / face_height

    # jaw drop
    aus["AU26"] = (lip_gap * 1.5) / face_height

    # blink?
    aus["AU45"] = max(0, (0.015 * face_height - eye_avg) / (0.015 * face_height))

    return aus
