"""
SmartWaste AI - Machine Learning Prediction Service (FastAPI)
Provides real-time bin fill-level predictions, time-to-overflow estimation,
and confidence metrics using trained Scikit-Learn pipelines.
"""

import os
import json
import logging
from typing import List, Optional
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model_trainer import (
    MODEL_FILE,
    METADATA_FILE,
    FEATURE_NUMERIC,
    FEATURE_CATEGORICAL,
    train_and_evaluate,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("econexa-ml")

app = FastAPI(
    title="EcoNexa - Machine Learning Service",
    description="Waste generation prediction and overflow estimation using scikit-learn Random Forest regression.",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
pipeline = None
model_metadata = {}

def load_or_train_model():
    global pipeline, model_metadata
    if not os.path.exists(MODEL_FILE) or not os.path.exists(METADATA_FILE):
        logger.info("Trained model not found. Initiating automated training...")
        train_and_evaluate()

    logger.info(f"Loading model artifact from {MODEL_FILE}...")
    pipeline = joblib.load(MODEL_FILE)

    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        model_metadata = json.load(f)
    logger.info("Model loaded successfully.")

@app.on_event("startup")
def startup_event():
    try:
        load_or_train_model()
    except Exception as e:
        logger.error(f"Error loading model during startup: {e}")

class PredictionRequest(BaseModel):
    bin_id: Optional[str] = "BIN-SAMPLE"
    ward: str = Field(default="Ward-1 Central Market", description="Municipal Ward Name")
    category: str = Field(default="general", description="Waste category: general, recyclable, organic, hazardous")
    capacity_liters: float = Field(default=1000.0, ge=100.0, le=10000.0)
    current_fill_percentage: float = Field(..., ge=0.0, le=100.0)
    hour_of_day: Optional[int] = Field(default=None, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    is_weekend: Optional[int] = Field(default=None, ge=0, le=1)
    hours_since_last_collection: Optional[float] = Field(default=12.0, ge=0.0)
    historical_filling_rate: Optional[float] = Field(default=None, ge=0.0, description="% fill increase per hour")
    critical_threshold: Optional[float] = Field(default=80.0, ge=50.0, le=100.0)

class HorizonPrediction(BaseModel):
    horizon_hours: int
    predicted_fill_percentage: float
    status: str

class PredictionResponse(BaseModel):
    bin_id: str
    current_fill_percentage: float
    critical_threshold: float
    predictions: List[HorizonPrediction]
    estimated_hours_to_overflow: Optional[float]
    projected_overflow_timestamp: Optional[str]
    confidence_score: float
    prediction_source: str
    model_version: str
    generated_at: str

class BatchPredictionRequest(BaseModel):
    bins: List[PredictionRequest]

def calculate_time_to_overflow(current_fill: float, pred_6h: float, pred_12h: float, pred_24h: float, threshold: float = 80.0) -> Optional[float]:
    """Computes non-linear interpolation for estimated hours remaining until critical threshold."""
    if current_fill >= threshold:
        return 0.0

    points = [(0.0, current_fill), (6.0, pred_6h), (12.0, pred_12h), (24.0, pred_24h)]
    for i in range(len(points) - 1):
        t1, f1 = points[i]
        t2, f2 = points[i + 1]
        if f1 < threshold <= f2:
            if f2 == f1:
                return round(t1, 1)
            t_interp = t1 + (threshold - f1) * (t2 - t1) / (f2 - f1)
            return round(t_interp, 1)

    # If it won't overflow within 24 hours, extrapolate using 12h-24h rate
    slope = (pred_24h - pred_12h) / 12.0
    if slope > 0.05:
        extrapolated_hours = 24.0 + (threshold - pred_24h) / slope
        return round(min(extrapolated_hours, 168.0), 1)  # cap at 7 days

    return None

def determine_status(fill: float, threshold: float) -> str:
    if fill >= threshold:
        return "critical"
    elif fill >= threshold * 0.75:
        return "warning"
    return "normal"

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "EcoNexa ML Engine",
        "model_loaded": pipeline is not None,
        "version": model_metadata.get("version", "1.2.0"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@app.get("/metrics")
def get_metrics():
    if not model_metadata:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model metadata not yet loaded")
    return model_metadata

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    global pipeline
    if pipeline is None:
        load_or_train_model()

    now = datetime.utcnow()
    hour = req.hour_of_day if req.hour_of_day is not None else now.hour
    dow = req.day_of_week if req.day_of_week is not None else now.weekday()
    weekend = req.is_weekend if req.is_weekend is not None else (1 if dow in [5, 6] else 0)

    # Heuristic fallback if historical filling rate is provided or default
    hist_rate = req.historical_filling_rate
    if hist_rate is None or hist_rate <= 0:
        # Default baseline rate based on category
        cat_defaults = {"organic": 2.5, "recyclable": 1.8, "general": 2.0, "hazardous": 0.5}
        hist_rate = cat_defaults.get(req.category.lower(), 2.0)

    # Input dataframe matching training schema
    input_data = pd.DataFrame([{
        "capacity_liters": req.capacity_liters,
        "current_fill_percentage": req.current_fill_percentage,
        "hour_of_day": hour,
        "day_of_week": dow,
        "is_weekend": weekend,
        "hours_since_last_collection": req.hours_since_last_collection or 12.0,
        "historical_filling_rate": hist_rate,
        "ward": req.ward,
        "category": req.category.lower(),
    }])

    try:
        preds = pipeline.predict(input_data)[0]
        # Guarantee non-decreasing fill level without collection event
        p6 = max(req.current_fill_percentage, min(100.0, float(preds[0])))
        p12 = max(p6, min(100.0, float(preds[1])))
        p24 = max(p12, min(100.0, float(preds[2])))

        # Calculate time to overflow
        hours_to_overflow = calculate_time_to_overflow(
            req.current_fill_percentage, p6, p12, p24, req.critical_threshold or 80.0
        )

        projected_ts = None
        if hours_to_overflow is not None:
            future_sec = hours_to_overflow * 3600
            overflow_time = datetime.fromtimestamp(now.timestamp() + future_sec)
            projected_ts = overflow_time.isoformat() + "Z"

        # Statistical confidence based on model test R2 score & input variance
        avg_r2 = model_metadata.get("aggregate_metrics", {}).get("average_R2", 0.92)
        confidence = round(max(0.70, min(0.98, avg_r2 - 0.05 * (p24 - req.current_fill_percentage) / 100.0)), 2)

        return PredictionResponse(
            bin_id=req.bin_id or "BIN-DEMO",
            current_fill_percentage=round(req.current_fill_percentage, 1),
            critical_threshold=req.critical_threshold or 80.0,
            predictions=[
                HorizonPrediction(
                    horizon_hours=6,
                    predicted_fill_percentage=round(p6, 1),
                    status=determine_status(p6, req.critical_threshold or 80.0),
                ),
                HorizonPrediction(
                    horizon_hours=12,
                    predicted_fill_percentage=round(p12, 1),
                    status=determine_status(p12, req.critical_threshold or 80.0),
                ),
                HorizonPrediction(
                    horizon_hours=24,
                    predicted_fill_percentage=round(p24, 1),
                    status=determine_status(p24, req.critical_threshold or 80.0),
                ),
            ],
            estimated_hours_to_overflow=hours_to_overflow,
            projected_overflow_timestamp=projected_ts,
            confidence_score=confidence,
            prediction_source="ml_random_forest_regressor",
            model_version=model_metadata.get("version", "1.2.0"),
            generated_at=now.isoformat() + "Z",
        )
    except Exception as e:
        logger.warning(f"ML Pipeline evaluation error: {e}. Falling back to baseline filling rate projection.")
        # Baseline analytical heuristic fallback
        p6 = min(100.0, req.current_fill_percentage + hist_rate * 6)
        p12 = min(100.0, req.current_fill_percentage + hist_rate * 12)
        p24 = min(100.0, req.current_fill_percentage + hist_rate * 24)
        hours_to_overflow = round((req.critical_threshold - req.current_fill_percentage) / hist_rate, 1) if req.current_fill_percentage < req.critical_threshold else 0.0

        return PredictionResponse(
            bin_id=req.bin_id or "BIN-DEMO",
            current_fill_percentage=round(req.current_fill_percentage, 1),
            critical_threshold=req.critical_threshold or 80.0,
            predictions=[
                HorizonPrediction(horizon_hours=6, predicted_fill_percentage=round(p6, 1), status=determine_status(p6, req.critical_threshold)),
                HorizonPrediction(horizon_hours=12, predicted_fill_percentage=round(p12, 1), status=determine_status(p12, req.critical_threshold)),
                HorizonPrediction(horizon_hours=24, predicted_fill_percentage=round(p24, 1), status=determine_status(p24, req.critical_threshold)),
            ],
            estimated_hours_to_overflow=max(0.0, hours_to_overflow),
            projected_overflow_timestamp=None,
            confidence_score=0.65,
            prediction_source="baseline_heuristic_rate",
            model_version="heuristic-1.0",
            generated_at=now.isoformat() + "Z",
        )

@app.post("/batch-predict", response_model=List[PredictionResponse])
def batch_predict(batch: BatchPredictionRequest):
    results = []
    for item in batch.bins:
        results.append(predict(item))
    return results

@app.post("/retrain")
def retrain():
    try:
        metadata = train_and_evaluate()
        load_or_train_model()
        return {
            "status": "success",
            "message": "Model retrained and updated successfully",
            "metadata": metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
