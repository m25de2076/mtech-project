from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ResearchPredictionInput(BaseModel):
    relative_humidity: float
    avg_wind_speed: float
    pressure_hpa: float
    pm25: float
    pm10: float
    noise: float
    hour: int = Field(ge=0, le=23)
    dayofweek: int = Field(ge=0, le=6)
    month: int = Field(ge=1, le=12)
    latitude: float
    longitude: float


class ResearchPredictionOutput(BaseModel):
    predicted_temperature_c: float
    model_name: str
    model_loaded: bool


class ModelInfo(BaseModel):
    name: str
    model_type: str
    model_loaded: bool
    feature_names: list[str]
    hyperparameters: dict[str, int | float | str | bool | None]
    feature_importance: list[dict[str, float | str]]
    reported_metrics: dict[str, float]
    validation_note: str


class TwinZoneReading(BaseModel):
    timestamp: str
    zone_id: str
    zone_name: str
    zone_type: str
    latitude: float
    longitude: float
    built_density: float
    vegetation_index: float
    air_temp_c: float
    relative_humidity: float
    solar_radiation_wm2: float
    wind_speed_ms: float
    hotspot_index: float = Field(ge=0, le=100)
    status: Literal["stable", "watch", "hotspot", "critical"]


class ReplayState(BaseModel):
    playing: bool
    speed: int
    frame_index: int
    frame_count: int
    current_timestamp: str


class TwinFrame(BaseModel):
    readings: list[TwinZoneReading]
    replay: ReplayState
    average_temperature_c: float
    average_humidity_pct: float
    hotspot_zone_id: str
    hotspot_zone_name: str
    events: list[str]


class ReplayControl(BaseModel):
    action: Literal["play", "pause", "reset", "step"] | None = None
    speed: int | None = Field(default=None, ge=1, le=500)


class RegionalStation(BaseModel):
    station: str
    valid_days: int
    p95_hourly_c: float
    hours_ge_35_pct: float
    day_night_c: float
