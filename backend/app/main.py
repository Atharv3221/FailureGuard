from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schema import SensorInput, PredictionResponse
from app.features import engineer_features
from app.model import Predictor

# THIS LINE IS REQUIRED
app = FastAPI(title="Predictive Maintenance API")

# CORS — allows the React frontend (localhost:5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = Predictor()


@app.get("/")
def root():
    return {"message": "API is running"}


@app.post("/predict", response_model=PredictionResponse)
def predict(data: SensorInput):
    input_dict = data.dict()

    features = engineer_features(input_dict)

    prediction, probability = predictor.predict(features)

    return {
        "failure_prediction": prediction,
        "failure_probability": probability
    }
