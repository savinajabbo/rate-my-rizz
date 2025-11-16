import numpy as np

def compute_rizz(aus: dict) -> dict:
    get = aus.get
    AU01 = float(get("AU01", 0.0))
    AU02 = float(get("AU02", 0.0))
    AU04 = float(get("AU04", 0.0))
    AU06 = float(get("AU06", 0.0))
    AU07 = float(get("AU07", 0.0))
    AU12 = float(get("AU12", 0.0))
    AU25 = float(get("AU25", 0.0))
    AU26 = float(get("AU26", 0.0))
