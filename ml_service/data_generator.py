"""
SmartWaste AI - Synthetic Dataset Generator
Simulates realistic municipal waste accumulation patterns based on:
- Ward characteristics (Market, Tech Park, Residential, Commercial, Metro)
- Waste category filling dynamics (Organic, Recyclable, General, Hazardous)
- Diurnal human activity cycles (peak hours 08:00-11:00 and 18:00-21:00)
- Day-of-week / weekend variations
"""

import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta

WARDS = [
    {"name": "Ward-1 Central Market", "type": "commercial", "base_rate": 2.8, "peak_mult": 1.6},
    {"name": "Ward-2 Tech Corridor", "type": "commercial", "base_rate": 2.2, "peak_mult": 1.4},
    {"name": "Ward-3 Green Residences", "type": "residential", "base_rate": 1.8, "peak_mult": 1.3},
    {"name": "Ward-4 Metro Station", "type": "transit", "base_rate": 2.5, "peak_mult": 1.7},
    {"name": "Ward-5 Heritage Quarter", "type": "tourist", "base_rate": 2.0, "peak_mult": 1.5},
]

CATEGORIES = {
    "organic": {"rate_mult": 1.3, "variance": 0.4},
    "recyclable": {"rate_mult": 1.1, "variance": 0.3},
    "general": {"rate_mult": 1.0, "variance": 0.3},
    "hazardous": {"rate_mult": 0.3, "variance": 0.1},
}

def get_hourly_activity_multiplier(hour: int) -> float:
    """Human activity curve across 24 hours."""
    if 0 <= hour < 5:
        return 0.15  # Night minimum
    elif 5 <= hour < 8:
        return 0.55  # Morning start
    elif 8 <= hour < 12:
        return 1.45  # Morning peak
    elif 12 <= hour < 14:
        return 1.10  # Lunch lull
    elif 14 <= hour < 18:
        return 1.25  # Afternoon activity
    elif 18 <= hour < 22:
        return 1.50  # Evening peak
    else:
        return 0.45  # Night wind-down

def generate_dataset(num_samples: int = 6000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    random.seed(random_seed)

    records = []
    base_time = datetime(2026, 1, 1, 0, 0, 0)

    for i in range(num_samples):
        ward_info = random.choice(WARDS)
        ward_name = ward_info["name"]
        category = random.choice(list(CATEGORIES.keys()))
        cat_info = CATEGORIES[category]

        # Time factors
        time_offset = timedelta(hours=i % (24 * 60), minutes=random.randint(0, 59))
        record_time = base_time + time_offset
        hour = record_time.hour
        day_of_week = record_time.weekday()
        is_weekend = 1 if day_of_week in [5, 6] else 0

        # Current state
        current_fill = round(random.uniform(5.0, 75.0), 1)
        hours_since_last_col = round(random.uniform(1.0, 72.0), 1)

        # Base rate
        base_rate = ward_info["base_rate"] * cat_info["rate_mult"]
        hour_mult = get_hourly_activity_multiplier(hour)
        weekend_mult = 1.25 if (is_weekend and ward_info["type"] in ["residential", "tourist"]) else (0.75 if (is_weekend and ward_info["type"] == "commercial") else 1.0)

        effective_rate = base_rate * hour_mult * weekend_mult + np.random.normal(0, cat_info["variance"])
        effective_rate = max(0.2, round(effective_rate, 2))

        # Project future fill for 6h, 12h, 24h
        def project_fill(horizon_hrs: int) -> float:
            acc = 0.0
            for h in range(horizon_hrs):
                future_hour = (hour + h) % 24
                h_mult = get_hourly_activity_multiplier(future_hour)
                step_rate = base_rate * h_mult * weekend_mult + np.random.normal(0, 0.2)
                acc += max(0.1, step_rate)
            return min(100.0, round(current_fill + acc, 1))

        target_6h = project_fill(6)
        target_12h = project_fill(12)
        target_24h = project_fill(24)

        # Capacity
        capacity = random.choice([500, 750, 1000, 1200, 1500])

        records.append({
            "ward": ward_name,
            "category": category,
            "capacity_liters": capacity,
            "current_fill_percentage": current_fill,
            "hour_of_day": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "hours_since_last_collection": hours_since_last_col,
            "historical_filling_rate": effective_rate,
            "fill_next_6h": target_6h,
            "fill_next_12h": target_12h,
            "fill_next_24h": target_24h,
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    df = generate_dataset()
    print(f"Generated dataset with shape: {df.shape}")
    print(df.head())
    df.to_csv("trained_model/synthetic_waste_training_data.csv", index=False)
    print("Saved to trained_model/synthetic_waste_training_data.csv")
