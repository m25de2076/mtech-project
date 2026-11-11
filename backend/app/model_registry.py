from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from .models import ModelInfo, ResearchPredictionInput, ResearchPredictionOutput

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "assets" / "models" / "random_forest_final.joblib"

FEATURES = [
    "relative_humidity",
    "avg_wind_speed",
    "pressure_hpa",
    "pm25",
    "pm10",
    "noise",
    "hour",
    "dayofweek",
    "month",
    "latitude",
    "longitude",
]

REPORTED_METRICS = {"mae_c": 2.214, "rmse_c": 2.820, "r2": 0.714}
HYPERPARAMETERS = {
    "n_estimators": 220,
    "max_depth": 18,
    "min_samples_leaf": 2,
    "max_features": "sqrt",
    "random_state": 42,
}
FEATURE_IMPORTANCE = [
    {"feature": "relative_humidity", "importance": 0.380540},
    {"feature": "month", "importance": 0.315021},
    {"feature": "pressure_hpa", "importance": 0.096859},
    {"feature": "hour", "importance": 0.095240},
    {"feature": "pm25", "importance": 0.024275},
    {"feature": "dayofweek", "importance": 0.022381},
    {"feature": "pm10", "importance": 0.018701},
    {"feature": "latitude", "importance": 0.015263},
    {"feature": "noise", "importance": 0.011052},
    {"feature": "longitude", "importance": 0.010447},
    {"feature": "avg_wind_speed", "importance": 0.010220},
]


class ModelRegistry:
    def __init__(self) -> None:
        self.model: Any | None = None
        self.load_error: str | None = None

    def _ensure_loaded(self) -> None:
        if self.model is not None:
            return
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model file not found: {MODEL_PATH}")
        try:
            self.model = joblib.load(MODEL_PATH)
        except Exception as exc:
            self.load_error = str(exc)
            raise RuntimeError(self.load_error) from exc

    def predict(self, payload: ResearchPredictionInput) -> ResearchPredictionOutput:
        self._ensure_loaded()
        row = pd.DataFrame([payload.model_dump()], columns=FEATURES)
        prediction = float(self.model.predict(row)[0])
        return ResearchPredictionOutput(
            predicted_temperature_c=round(prediction, 3),
            model_name="Random Forest",
            model_loaded=True,
        )

    def info(self) -> ModelInfo:
        return ModelInfo(
            name="Random Forest Temperature Model",
            model_type="Pipeline(SimpleImputer + RandomForestRegressor)",
            model_loaded=MODEL_PATH.exists(),
            feature_names=FEATURES,
            hyperparameters=HYPERPARAMETERS,
            feature_importance=FEATURE_IMPORTANCE,
            reported_metrics=REPORTED_METRICS,
            validation_note=(
                "The displayed validation metrics are the reported Melbourne chronological-test results from the research workflow. "
                "The saved 1.5 GB model is loaded lazily only when an interactive prediction is requested, keeping normal dashboard startup lightweight."
            ),
        )


registry = ModelRegistry()
