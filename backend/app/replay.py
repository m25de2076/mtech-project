from __future__ import annotations

import asyncio
from pathlib import Path

import pandas as pd

from .models import ReplayState, TwinFrame, TwinZoneReading

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR.parent / "data" / "simulation" / "simulated_microclimate.csv"


class TwinReplayEngine:
    def __init__(self) -> None:
        if not CSV_PATH.exists():
            raise FileNotFoundError(f"Simulation CSV not found: {CSV_PATH}")

        frame = pd.read_csv(CSV_PATH)
        required = {
            "timestamp", "zone_id", "zone_name", "zone_type", "latitude", "longitude",
            "built_density", "vegetation_index", "air_temp_c", "relative_humidity",
            "solar_radiation_wm2", "wind_speed_ms",
        }
        missing = sorted(required.difference(frame.columns))
        if missing:
            raise ValueError(f"Simulation CSV missing required columns: {missing}")

        frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="raise")
        frame = frame.sort_values(["timestamp", "zone_id"]).reset_index(drop=True)
        self.frame = frame
        self.timestamps = frame["timestamp"].drop_duplicates().tolist()
        self.playing = True
        self.speed = 10
        self.index = 0
        self._lock = asyncio.Lock()

    def _status(self, score: float) -> str:
        if score >= 80:
            return "critical"
        if score >= 65:
            return "hotspot"
        if score >= 45:
            return "watch"
        return "stable"

    def _hotspot_index(self, row: pd.Series) -> float:
        temp_component = max(0.0, min(1.0, (float(row.air_temp_c) - 24.0) / 18.0)) * 55.0
        density_component = float(row.built_density) * 18.0
        vegetation_component = (1.0 - float(row.vegetation_index)) * 15.0
        solar_component = max(0.0, min(1.0, float(row.solar_radiation_wm2) / 1000.0)) * 12.0
        return max(0.0, min(100.0, temp_component + density_component + vegetation_component + solar_component))

    def _current_rows(self) -> pd.DataFrame:
        timestamp = self.timestamps[self.index]
        return self.frame[self.frame["timestamp"] == timestamp]

    def _build_frame(self, advance: bool) -> TwinFrame:
        rows = self._current_rows()
        readings: list[TwinZoneReading] = []
        for _, row in rows.iterrows():
            hotspot_index = self._hotspot_index(row)
            readings.append(
                TwinZoneReading(
                    timestamp=row.timestamp.isoformat(),
                    zone_id=str(row.zone_id),
                    zone_name=str(row.zone_name).replace("_", " "),
                    zone_type=str(row.zone_type),
                    latitude=float(row.latitude),
                    longitude=float(row.longitude),
                    built_density=float(row.built_density),
                    vegetation_index=float(row.vegetation_index),
                    air_temp_c=float(row.air_temp_c),
                    relative_humidity=float(row.relative_humidity),
                    solar_radiation_wm2=float(row.solar_radiation_wm2),
                    wind_speed_ms=float(row.wind_speed_ms),
                    hotspot_index=round(hotspot_index, 2),
                    status=self._status(hotspot_index),
                )
            )

        hotspot = max(readings, key=lambda item: item.hotspot_index)
        current_timestamp = self.timestamps[self.index].isoformat()
        replay = ReplayState(
            playing=self.playing,
            speed=self.speed,
            frame_index=self.index,
            frame_count=len(self.timestamps),
            current_timestamp=current_timestamp,
        )
        result = TwinFrame(
            readings=readings,
            replay=replay,
            average_temperature_c=round(sum(item.air_temp_c for item in readings) / len(readings), 2),
            average_humidity_pct=round(sum(item.relative_humidity for item in readings) / len(readings), 2),
            hotspot_zone_id=hotspot.zone_id,
            hotspot_zone_name=hotspot.zone_name,
            events=[
                f"Replay timestamp {current_timestamp}",
                f"Highest hotspot index: {hotspot.zone_name} ({hotspot.hotspot_index:.1f})",
            ],
        )

        if advance and self.playing:
            self.index = (self.index + self.speed) % len(self.timestamps)
        return result

    async def next_frame(self) -> TwinFrame:
        async with self._lock:
            return self._build_frame(advance=True)

    async def snapshot(self) -> TwinFrame:
        async with self._lock:
            return self._build_frame(advance=False)

    async def control(self, action: str | None = None, speed: int | None = None) -> ReplayState:
        async with self._lock:
            if speed is not None:
                self.speed = speed
            if action == "play":
                self.playing = True
            elif action == "pause":
                self.playing = False
            elif action == "reset":
                self.index = 0
            elif action == "step":
                self.index = (self.index + max(1, self.speed)) % len(self.timestamps)

            return ReplayState(
                playing=self.playing,
                speed=self.speed,
                frame_index=self.index,
                frame_count=len(self.timestamps),
                current_timestamp=self.timestamps[self.index].isoformat(),
            )

    def summary(self) -> dict:
        return {
            "records": int(len(self.frame)),
            "zones": int(self.frame["zone_id"].nunique()),
            "timestamps": int(len(self.timestamps)),
            "start": self.frame["timestamp"].min().isoformat(),
            "end": self.frame["timestamp"].max().isoformat(),
            "interval_minutes": 15,
            "zone_names": [str(item).replace("_", " ") for item in self.frame["zone_name"].drop_duplicates().tolist()],
        }
