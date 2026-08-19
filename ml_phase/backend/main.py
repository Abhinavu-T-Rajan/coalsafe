from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

app = FastAPI()

# Load trained ML model
model = joblib.load("../minesafe_priority_model.pkl")


class Incident(BaseModel):
    incident_type: str
    severity: str
    workers_at_risk: int
    injured_count: int
    hazard_intensity: int
    workers_in_danger_zone: int
    nearest_worker_distance_m: float
    communication_status: str
    rescue_response_time_min: float
    time_since_incident_min: int


@app.get("/")
def home():
    return {"message": "MineSafe API is running"}


@app.post("/predict")
def predict(incident: Incident):

    data = pd.DataFrame([incident.model_dump()])

    prediction = model.predict(data)[0]

    probabilities = model.predict_proba(data)[0]
    classes = model.classes_

    confidence = float(max(probabilities))

    return {
        "priority": prediction,
        "confidence": round(confidence, 3)
    }