from pydantic import BaseModel


class SensorInput(BaseModel):
    Type: int
    air_temperature: float
    process_temperature: float
    rotational_speed: float
    torque: float
    tool_wear: float


class PredictionResponse(BaseModel):
    failure_prediction: int
    failure_probability: float
