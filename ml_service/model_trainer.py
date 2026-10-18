"""
SmartWaste AI - Machine Learning Model Trainer
Trains a Random Forest Regressor pipeline for multi-horizon fill prediction (6h, 12h, 24h).
Calculates MAE, RMSE, and R2 evaluation metrics.
Saves model artifacts and performance metadata.
"""

import json
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from data_generator import generate_dataset, WARDS, CATEGORIES

MODEL_DIR = os.path.join(os.path.dirname(__file__), "trained_model")
MODEL_FILE = os.path.join(MODEL_DIR, "waste_prediction_rf.joblib")
METADATA_FILE = os.path.join(MODEL_DIR, "metadata.json")

FEATURE_NUMERIC = [
    "capacity_liters",
    "current_fill_percentage",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "hours_since_last_collection",
    "historical_filling_rate",
]

FEATURE_CATEGORICAL = [
    "ward",
    "category",
]

TARGETS = [
    "fill_next_6h",
    "fill_next_12h",
    "fill_next_24h",
]

def train_and_evaluate():
    os.makedirs(MODEL_DIR, exist_ok=True)
    print("Generating simulated historical municipal dataset...")
    df = generate_dataset(num_samples=7500, random_seed=42)

    X = df[FEATURE_NUMERIC + FEATURE_CATEGORICAL]
    y = df[TARGETS]

    # Time-aware sequential split (80% train, 20% test)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    print(f"Dataset split: Train={len(X_train)} samples, Test={len(X_test)} samples")

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), FEATURE_NUMERIC),
            ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURE_CATEGORICAL),
        ]
    )

    base_rf = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    multi_rf = MultiOutputRegressor(base_rf)

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", multi_rf),
        ]
    )

    print("Training Random Forest Regressor pipeline...")
    pipeline.fit(X_train, y_train)

    print("Evaluating model performance on test set...")
    y_pred = pipeline.predict(X_test)

    # Calculate metrics for each horizon
    metrics = {}
    for idx, target_name in enumerate(TARGETS):
        actual = y_test[target_name].values
        predicted = np.clip(y_pred[:, idx], 0.0, 100.0)

        mae = float(mean_absolute_error(actual, predicted))
        rmse = float(np.sqrt(mean_squared_error(actual, predicted)))
        r2 = float(r2_score(actual, predicted))

        metrics[target_name] = {
            "MAE": round(mae, 2),
            "RMSE": round(rmse, 2),
            "R2": round(r2, 4),
        }
        print(f"[{target_name}] MAE: {mae:.2f}%, RMSE: {rmse:.2f}%, R2: {r2:.4f}")

    # Overall average metrics
    avg_mae = np.mean([m["MAE"] for m in metrics.values()])
    avg_rmse = np.mean([m["RMSE"] for m in metrics.values()])
    avg_r2 = np.mean([m["R2"] for m in metrics.values()])

    metadata = {
        "model_name": "Multi-Horizon Random Forest Regressor",
        "version": "1.2.0",
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "sample_count": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": {
            "numeric": FEATURE_NUMERIC,
            "categorical": FEATURE_CATEGORICAL,
        },
        "target_horizons": TARGETS,
        "metrics_per_horizon": metrics,
        "aggregate_metrics": {
            "average_MAE": round(float(avg_mae), 2),
            "average_RMSE": round(float(avg_rmse), 2),
            "average_R2": round(float(avg_r2), 4),
        },
        "wards_covered": [w["name"] for w in WARDS],
        "categories_covered": list(CATEGORIES.keys()),
        "data_notice": "Trained on calibrated municipal waste dynamic simulation dataset reflecting diurnal & weekly cycle variances.",
    }

    print(f"Saving model artifact to: {MODEL_FILE}")
    joblib.dump(pipeline, MODEL_FILE)

    print(f"Saving metadata to: {METADATA_FILE}")
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("Model training and artifact generation complete!")
    return metadata

if __name__ == "__main__":
    train_and_evaluate()
