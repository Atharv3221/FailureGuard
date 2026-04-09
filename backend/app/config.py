import os

# backend/app → backend → project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

MODEL_PATH = os.path.join(BASE_DIR, "ml", "model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml", "scaler.pkl")
THRESHOLD_PATH = os.path.join(BASE_DIR, "ml", "threshold.pkl")
