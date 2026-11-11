# Urban Microclimate Command Center

A local web application for multi-scale microclimate research visualization, Random Forest temperature inference, and 3D digital-twin replay of simulated micro-zone data.

See [DIGITAL_TWIN.md](DIGITAL_TWIN.md) for the detailed district, model exports, phone AR and HTTPS setup.

## Integrated Data Paths

### Research Analytics

The application uses the saved Melbourne Random Forest model located at:

```text
backend/assets/models/random_forest_final.joblib
```

The model is a pipeline containing a median imputer and a Random Forest regressor. Its native input schema is:

```text
relative_humidity
avg_wind_speed
pressure_hpa
pm25
pm10
noise
hour
dayofweek
month
latitude
longitude
```

The model is loaded lazily when an interactive prediction is requested. This keeps normal dashboard startup lightweight because the model file is approximately 1.5 GB.

### Digital Twin

The 3D digital twin replays the existing simulation file directly:

```text
backend/data/simulation/simulated_microclimate.csv
```

Dataset summary:

- 46,080 records
- 8 micro-zones
- 5,760 timestamps
- 15-minute interval
- 60-day simulation window

The replay engine supports play, pause, reset, step, and 1x / 10x / 50x / 100x playback speeds.

The digital-twin hotspot index is a transparent simulation indicator derived from observed simulated temperature, built density, vegetation, and solar radiation. It is not presented as a medically validated heat-risk index.

### Regional Context

NWDP Karnataka is retained as the regional heat-context layer. The application displays the project-reported station screening results separately from the local digital-twin simulation.

## Environment

Use Python 3.13 for the backend.

The model file was saved with scikit-learn 1.9.0, therefore the backend pins the same version.

## Start the Backend

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

## Start the Frontend

Open a second Terminal window:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://127.0.0.1:5173
```

## Application Views

### Mission Control

- live CSV replay status
- 3D microclimate digital twin
- selected-zone telemetry
- hotspot index and thermal-context interpretation
- playback controls
- zone telemetry matrix

### Research Analytics

- Melbourne project summary
- saved Random Forest metadata
- model hyperparameters
- native 11-feature schema
- feature importance from the saved model
- reported chronological-test metrics
- interactive model inference using the correct feature schema

### Digital Twin

- eight distinct micro-zone representations
- live telemetry superimposed on the 3D environment
- hotspot-status coloring
- replay controls
- current environmental readings for each zone

### Regional Context

- NWDP regional screening summary
- top five regional heat-screening stations
- macro-to-micro project architecture

## Scientific Separation

The saved Random Forest model and the digital-twin CSV are intentionally not forced into the same feature pipeline.

The Random Forest was trained with the Melbourne research feature schema. The simulated digital-twin CSV contains a different schema. The digital twin therefore uses the simulation records for live environmental visualization, while the Random Forest is used in the Research Analytics workflow with its correct 11 inputs.

This prevents invalid feature substitution and keeps the application scientifically interpretable.

## Installing the Existing Random Forest Model

The downloadable code package does not duplicate the large model binary. Use the model file already present in your existing project.

From the project root:

```bash
./setup_model.sh "/full/path/to/random_forest_final.joblib"
```

Example if the old project is in Downloads:

```bash
./setup_model.sh "$HOME/Downloads/microclimate-command-center 2/backend/assets/models/random_forest_final.joblib"
```

After the copy completes, start the backend normally. The Research Analytics screen will show `Random Forest READY`.
