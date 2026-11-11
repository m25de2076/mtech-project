from __future__ import annotations

import asyncio

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .model_registry import registry
from .models import ReplayControl, ResearchPredictionInput
from .regional_data import REGIONAL_SUMMARY
from .replay import TwinReplayEngine

app = FastAPI(title="Urban Microclimate Command Center", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

replay = TwinReplayEngine()


@app.get("/api/health")
def health() -> dict:
    info = registry.info()
    return {
        "status": "ok",
        "model_loaded": info.model_loaded,
        "model_name": info.name,
        "simulation_records": replay.summary()["records"],
    }


@app.get("/api/research/model")
def model_info() -> dict:
    return registry.info().model_dump()


@app.post("/api/research/predict")
def research_predict(payload: ResearchPredictionInput) -> dict:
    try:
        return registry.predict(payload).model_dump()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/research/melbourne")
def melbourne_summary() -> dict:
    return {
        "dashboard_observations": 489879,
        "selected_locations": 5,
        "mean_air_temperature_c": 16.57,
        "mean_relative_humidity_pct": 69.66,
        "high_temperature_events": 20412,
        "prediction_train_rows": 747907,
        "prediction_test_rows": 186977,
        "random_forest_metrics": {"mae_c": 2.214, "rmse_c": 2.820, "r2": 0.714},
        "note": "Research summary values are the reported results from the submitted project workflow.",
    }


@app.get("/api/regional/summary")
def regional_summary() -> dict:
    return REGIONAL_SUMMARY


@app.get("/api/twin/summary")
def twin_summary() -> dict:
    return replay.summary()


@app.get("/api/twin/snapshot")
async def twin_snapshot() -> dict:
    return (await replay.snapshot()).model_dump()


@app.post("/api/twin/control")
async def twin_control(payload: ReplayControl) -> dict:
    return (await replay.control(payload.action, payload.speed)).model_dump()


@app.websocket("/ws/twin")
async def twin_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            frame = await replay.next_frame()
            await websocket.send_json(frame.model_dump())
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        return
