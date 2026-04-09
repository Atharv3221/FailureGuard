import joblib
import pandas as pd

from app.config import MODEL_PATH, SCALER_PATH, THRESHOLD_PATH


class Predictor:
    """
    Handles model loading and prediction logic.
    """

    def __init__(self):
        self.model     = joblib.load(MODEL_PATH)
        self.scaler    = joblib.load(SCALER_PATH)
        self.threshold = joblib.load(THRESHOLD_PATH)

    def predict(self, features: pd.DataFrame):
        """
        Generate prediction and probability.
        Keeps features as a named DataFrame throughout so StandardScaler
        doesn't warn about missing feature names.
        """

        # ✅ Transform but preserve column names
        scaled = pd.DataFrame(
            self.scaler.transform(features),
            columns=features.columns
        )

        probability = self.model.predict_proba(scaled)[0][1]
        prediction  = int(probability > self.threshold)

        return prediction, float(probability)
