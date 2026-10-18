# EcoNexa — Machine Learning Model Report

## 1. Executive Summary

The EcoNexa prediction service provides multi-horizon fill level forecasting (6, 12, and 24 hours) and predicts the remaining time before any municipal bin reaches its critical overflow threshold (configured at 80% capacity).

The model is built using **Python 3.12**, **Scikit-Learn 1.3**, **Pandas**, and **NumPy**, served over high-performance asynchronous REST endpoints using **FastAPI** and **Uvicorn**.

---

## 2. Feature Engineering & Dataset Calibration

The training pipeline ingests 7,500 hourly observations calibrated across 5 municipal wards, encompassing 4 distinct waste streams.

### Feature Space
1. **Numerical Features**:
   - `capacity_liters`: Bin total capacity (500 L – 1500 L)
   - `current_fill_percentage`: Immediate ultrasonic sensor fill reading (0.0% – 100.0%)
   - `hour_of_day`: Diurnal human activity indicator (0 – 23)
   - `day_of_week`: Weekly cycle index (0 = Monday, 6 = Sunday)
   - `is_weekend`: Binary flag for weekend consumer pattern shifts
   - `hours_since_last_collection`: Duration since vehicle clearance (1.0 – 72.0 hrs)
   - `historical_filling_rate`: Calibrated accumulation rate (%/hr)

2. **Categorical Features**:
   - `ward`: Commercial (Market, Tech Park), Residential, or Transit hubs
   - `category`: `organic` (1.3x rate), `recyclable` (1.1x rate), `general` (1.0x rate), `hazardous` (0.3x rate)

---

## 3. Model Architecture

- **Pipeline Preprocessing**:
  - `StandardScaler` for continuous numerical features.
  - `OneHotEncoder(handle_unknown='ignore')` for municipal wards and categories.
- **Estimator**:
  - `MultiOutputRegressor` wrapping `RandomForestRegressor`:
    - `n_estimators = 100`
    - `max_depth = 12`
    - `min_samples_split = 4`
    - `min_samples_leaf = 2`
    - `random_state = 42`
    - Multi-threading: `n_jobs = -1`

---

## 4. Empirical Evaluation Metrics (Test Set Split: 80% / 20%)

The model was evaluated using sequential time-aware testing (1,500 holdout test samples):

| Horizon Target | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | R² Score |
| :--- | :---: | :---: | :---: |
| **+6 Hours Horizon** | **1.43%** | **1.91%** | **0.9923** |
| **+12 Hours Horizon** | **2.16%** | **2.96%** | **0.9837** |
| **+24 Hours Horizon** | **1.36%** | **2.19%** | **0.9902** |
| **Aggregate Mean** | **1.65%** | **2.35%** | **0.9887** |

---

## 5. Time-to-Overflow Estimation

The estimated hours remaining until a bin hits its configured critical threshold $T$ (default: 80%) is computed using piecewise linear interpolation across projected points $(0, \text{fill}_0), (6, \text{pred}_{6}), (12, \text{pred}_{12}), (24, \text{pred}_{24})$:

$$t_{\text{overflow}} = t_1 + (T - f_1) \cdot \frac{t_2 - t_1}{f_2 - f_1}$$

If the threshold is not crossed within 24 hours, the trajectory is extrapolated up to 168 hours (7 days) based on the sustained 12h–24h accumulation slope.

---

## 6. Uncertainty & Confidence Scoring

Confidence scores are derived from test set variance and projection divergence:

$$\text{Confidence} = \max\left(0.70, \min\left(0.98, R^2_{\text{avg}} - 0.05 \cdot \frac{\text{pred}_{24} - \text{fill}_0}{100}\right)\right)$$

Predictions with high uncertainty (e.g. erratic variance) yield conservative confidence ratings.

---

## 7. Heuristic Fallback Robustness

In the event that the Python ML microservice is offline or in maintenance mode, the Node.js backend seamlessly engages an analytical filling-rate heuristic engine:
- Organic waste baseline: $2.5\% / \text{hr}$
- Recyclable waste baseline: $1.8\% / \text{hr}$
- General waste baseline: $2.0\% / \text{hr}$
- Hazardous waste baseline: $0.5\% / \text{hr}$

Fallback predictions are explicitly watermarked as `baseline_heuristic_rate` to maintain transparency with municipal authorities.
